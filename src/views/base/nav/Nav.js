import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { CSpinner, CRow, CCol, CBadge } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilPencil,
  cilTrash,
  cilChevronRight,
  cilChevronBottom,
} from "@coreui/icons";
import { useModal } from "../../../_helpers/HandleModals";
import useAxios from "../../../utils/useAxios";
import { CustomButton } from "../../../components";


const Actions = () => {
  const { showModal } = useModal();
  const [actions, setActions] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const { axiosRequest, isLoading } = useAxios();

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const { data } = await axiosRequest("/nav/all", "get");
      setActions(data || []);
    } catch (error) {
      console.error("Error fetching actions:", error);
    }
  };

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    const updated = reorderNestedNavGroups(actions, source, destination);
    setActions(updated);
    const payload = flattenActionsForApi(updated);
    try {
      await axiosRequest("/nav/reorder", "put", payload);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const reorderNestedNavGroups = (list, source, destination) => {
    const { item: movedItem, newList } = removeItemById(
      list,
      getItemIdAtPosition(list, source.droppableId, source.index)
    );
    if (!movedItem) return list;
    if (destination.droppableId !== "nav-root") {
      movedItem.group_id = destination.droppableId;
      movedItem.parent = destination.droppableId;
      movedItem.is_child = true;
    } else {
      movedItem.group_id = null;
      movedItem.is_child = false;
      movedItem.parent = null;
    }
    return addItemByGroupId(
      newList,
      destination.droppableId,
      movedItem,
      destination.index
    );
  };

  const removeItemById = (list, id) => {
    const newList = [];
    let foundItem = null;
    for (const el of list) {
      if (String(el.id) === String(id)) {
        foundItem = el;
      } else if (el.children && el.children.length > 0) {
        const { item, newList: updatedChildren } = removeItemById(
          el.children,
          id
        );
        if (item) {
          foundItem = item;
          newList.push({ ...el, children: updatedChildren });
        } else {
          newList.push(el);
        }
      } else {
        newList.push(el);
      }
    }
    return { item: foundItem, newList };
  };

  const addItemByGroupId = (list, parentId, newItem, insertIndex) => {
    if (parentId === "nav-root") {
      const newList = [...list];
      newList.splice(insertIndex, 0, newItem);
      return newList;
    }
    return list.map((el) => {
      if (String(el.id) === String(parentId)) {
        const children = el.children ? [...el.children] : [];
        children.splice(insertIndex, 0, newItem);
        return { ...el, children };
      } else if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: addItemByGroupId(
            el.children,
            parentId,
            newItem,
            insertIndex
          ),
        };
      }
      return el;
    });
  };

  const getItemIdAtPosition = (list, droppableId, index) => {
    const arr = getNestedListById(list, droppableId);
    const item = arr[index];
    return item ? item.id : null;
  };

  const getNestedListById = (list, id) => {
    if (id === "nav-root") return list;
    for (const item of list) {
      if (String(item.id) === String(id)) return item.children || [];
      if (item.children && item.children.length > 0) {
        const found = getNestedListById(item.children, id);
        if (found) return found;
      }
    }
    return [];
  };

  const flattenActionsForApi = (nestedList, parentId = null) => {
    return nestedList.reduce((acc, item, index) => {
      if (!item.id) {
        console.warn("Missing ID for nav item:", item);
        return acc;
      }
      acc.push({
        id: item.id,
        order_id: index + 1,
        group_id: parentId ?? null
      });
      if (item.children?.length) {
        acc = acc.concat(flattenActionsForApi(item.children, item.id));
      }
      return acc;
    }, []);
  };
  

  const renderNestedRows = (items) =>
    items.map((item, index) => {
      const isChild = !!item.parent || !!item.group_id;
      return (
        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`border rounded mb-2 px-3 py-2 shadow-sm ${isChild ? "ms-4 bg-light" : "bg-white"}`}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <strong>#{item.order_id}</strong>
                  {item.component === "CNavGroup" && (
                    <CIcon
                      icon={
                        expandedGroups[item.id]
                          ? cilChevronBottom
                          : cilChevronRight
                      }
                      role="button"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleGroup(item.id)}
                    />
                  )}
                  <span
                    className={isChild ? "fw-normal text-muted" : "fw-bold"}
                  >
                    {item.title || item.name}
                    <span className="text-muted ms-2">{item.to}</span>
                    {/* {isChild && <span className="fst-italic ms-2">sub item</span>} */}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  {item.parent && (
                    <CBadge color="light" className="text-dark border">
                      Parent: {item.parent}
                    </CBadge>
                  )}
                  <CBadge color={item.is_nav ? "success" : "secondary"}>
                    {item.is_nav ? "Nav" : "Hidden"}
                  </CBadge>
                  <CIcon
                    icon={cilPencil}
                    role="button"
                    className="text-primary"
                    onClick={() =>
                      showModal("AddNav", item, "edit", fetchActions)
                    }
                  />
                  <CIcon
                    icon={cilTrash}
                    role="button"
                    className="text-danger"
                    onClick={() =>
                      showModal("AddNav", item, "delete", fetchActions)
                    }
                  />
                </div>
              </div>
              {item.component === "CNavGroup" && expandedGroups[item.id] && (
                <Droppable droppableId={String(item.id)} type="NAV">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="pt-2 border-start ps-4"
                    >
                      {item.children?.map((child, childIndex) => (
                        <Draggable
                          key={child.id}
                          draggableId={String(child.id)}
                          index={childIndex}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-light border rounded mb-2 px-3 py-2 ms-3"
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>#{child.order_id}</strong>{" "}
                                  <span className="fw-medium">
                                    {child.title || child.name}
                                  </span>
                                  <span className="text-muted ms-2">
                                    {child.to}
                                  </span>
                                  {/* <span className="text-muted fst-italic ms-2">sub item</span> */}
                                </div>
                                <div className="d-flex gap-2">
                                  <CBadge
                                    color="light"
                                    className="text-dark border"
                                  >
                                    Parent: {child.parent}
                                  </CBadge>
                                  <CBadge
                                    color={
                                      child.is_nav ? "success" : "secondary"
                                    }
                                  >
                                    {child.is_nav ? "Nav" : "Hidden"}
                                  </CBadge>
                                  <CIcon
                                    icon={cilPencil}
                                    role="button"
                                    className="text-primary"
                                    onClick={() =>
                                      showModal(
                                        "AddNav",
                                        child,
                                        "edit",
                                        fetchActions
                                      )
                                    }
                                  />
                                  <CIcon
                                    icon={cilTrash}
                                    role="button"
                                    className="text-danger"
                                    onClick={() =>
                                      showModal(
                                        "AddNav",
                                        child,
                                        "delete",
                                        fetchActions
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )}
        </Draggable>
      );
    });

  if (isLoading) return <CSpinner color="primary" />;

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 className="card-title mb-0">Sidebar Navigation</h4>
        </CCol>
        <CCol sm={5} className="text-end">
          <CustomButton
            actionType="create"
            onClick={() => showModal("AddNav", "", "post")}
          >
            CREATE NEW
          </CustomButton>
        </CCol>
      </CRow>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="nav-root" type="NAV">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {renderNestedRows(actions)}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default Actions;
