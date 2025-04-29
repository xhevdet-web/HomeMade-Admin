const checkUserPermissions = (navItem, method, roleId) => {
  const roleRights = navItem?.role_rights?.find((rights) => rights?.role_id === roleId)
  return roleRights ? !!roleRights[method] : false
}


export default checkUserPermissions
