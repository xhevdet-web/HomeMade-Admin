import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard, CCardBody, CCardHeader,
  CCol, CRow, CForm, CFormInput, CSpinner, CBadge,
  CNav, CNavItem, CNavLink, CTabContent, CTabPane
} from "@coreui/react";
import useAxios from "../../../utils/useAxios";
import { useToast } from "../../../_helpers";
import { CustomButton } from "../../../components";
import { useAuthSelector } from "../../../redux/selectors/authSelectors";
// If you want global auth update on refresh, uncomment these:
// import { useDispatch } from "react-redux";
// import { setUser } from "../../../redux/slices/authSlice";

// --- helpers ---
const hasUpper = (s) => /[A-Z]/.test(s);
const hasLower = (s) => /[a-z]/.test(s);
const hasDigit = (s) => /[0-9]/.test(s);
const isLenOk = (s) => typeof s === "string" && s.length >= 8;

const passwordFeedback = (pwd) => {
  if (!pwd) return { ok: false, msg: "" };
  const missing = [];
  if (!isLenOk(pwd)) missing.push("at least 8 characters");
  if (!hasUpper(pwd)) missing.push("an uppercase letter");
  if (!hasLower(pwd)) missing.push("a lowercase letter");
  if (!hasDigit(pwd)) missing.push("a number");
  if (missing.length === 0) return { ok: true, msg: "Looks good." };
  const last = missing.pop();
  const sentence = missing.length ? `${missing.join(", ")} and ${last}` : last;
  return { ok: false, msg: `Password needs ${sentence}.` };
};

const getUserIdFromToken = () => {
  try {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("access_token");
    if (!token) return null;
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json?.user_data?.id || json?.sub || json?.id || null;
  } catch {
    return null;
  }
};

const buildName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(" ");
const extractRoleName = (u) => u?.users_role?.name || u?.role?.name || u?.role_name || "";

// --- component ---
const Profile = () => {
  const navigate = useNavigate();
  const { axiosRequest, isLoading } = useAxios();
  const { showToast } = useToast();
  const { userData } = useAuthSelector?.() || { userData: null };
  // const dispatch = useDispatch(); // if using global auth update

  const [effectiveId, setEffectiveId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [userInfo, setUserInfo] = useState({ name: "", role: "", email: "" });

  // tabs
  const [activeKey, setActiveKey] = useState("profile");

  // profile state
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNonce, setProfileNonce] = useState(0);

  // password state
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const newPwdFeedback = useMemo(
    () => passwordFeedback(form.new_password),
    [form.new_password]
  );
  const passwordsMatch = useMemo(
    () => (form.confirm_password ? form.new_password === form.confirm_password : true),
    [form.new_password, form.confirm_password]
  );

  const hydrateFromUser = (u) => {
    if (!u) return;
    setUserInfo({
      name: buildName(u),
      role: extractRoleName(u),
      email: u?.email || "",
    });
    setProfileForm({
      first_name: u?.first_name || "",
      last_name: u?.last_name || "",
      email: u?.email || "",
    });
  };

  const fetchUser = async (id) => {
    try {
      const resp = await axiosRequest(`/users/${id}`, "get");
      const res = resp?.data ?? resp;
      const u = res?.data ?? res;
      if (u) {
        hydrateFromUser(u);
        // If you want the whole app to reflect changes immediately:
        // dispatch(setUser(u));
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoadingUser(true);
      // If we have ID from store, still fetch fresh user
      if (userData?.id) {
        setEffectiveId(userData.id);
        await fetchUser(userData.id);
        setLoadingUser(false);
        return;
      }
      const idFromJwt = getUserIdFromToken();
      if (idFromJwt) {
        setEffectiveId(idFromJwt);
        await fetchUser(idFromJwt);
        setLoadingUser(false);
        return;
      }
      try {
        const resp = await axiosRequest("/auth/me", "get");
        const res = resp?.data ?? resp;
        const me = res?.data ?? res;
        if (res?.status === "Success" && me?.id) {
          setEffectiveId(me.id);
          await fetchUser(me.id);
        }
      } finally {
        setLoadingUser(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // profile handlers
  const onChangeProfile = (e) =>
    setProfileForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmitProfile = async (e) => {
    e.preventDefault();
    if (!effectiveId) return;
    const firstOk = profileForm.first_name.trim().length > 0;
    const lastOk = profileForm.last_name.trim().length > 0;
    if (!firstOk || !lastOk) return;

    try {
      setSavingProfile(true);
      const payload = {
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
      };
      const resp = await axiosRequest(`/users/${effectiveId}`, "put", payload);
      const res = resp?.data ?? resp;

      if (res?.status === "Success") {
        showToast("Success", "Profile updated.");
        // Re-fetch from API to ensure we show the latest data everywhere
        await fetchUser(effectiveId);
        setProfileNonce((n) => n + 1);
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // password handlers
  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveId) return;
    if (!form.current_password || !form.new_password || !form.confirm_password) return;
    if (!newPwdFeedback.ok) return;
    if (!passwordsMatch) return;

    try {
      setSubmitting(true);
      const payload = {
        current_password: form.current_password,
        new_password: form.new_password,
      };
      const resp = await axiosRequest(`/users/${effectiveId}/password`, "patch", payload);
      const res = resp?.data ?? resp;

      if (res?.status === "Success") {
        showToast("Success", "Password changed successfully.");
        setForm({ current_password: "", new_password: "", confirm_password: "" });
        setResetNonce((n) => n + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="text-center py-5">
        <CSpinner />
      </div>
    );
  }

  return (
    <CRow>
      <CCol md={12}>
        <CCard>
          <CCardHeader>
            Account Settings
            {(userInfo.name || userInfo.role) && (
              <div className="mt-2 small">
                <strong>{userInfo.name || "User"}</strong>{" "}
                {userInfo.role && (
                  <CBadge color="secondary" className="ms-2">
                    {userInfo.role}
                  </CBadge>
                )}
              </div>
            )}
          </CCardHeader>

          <CCardBody>
            {/* Tabs */}
            <CNav variant="tabs" role="tablist" className="mb-3">
              <CNavItem role="presentation">
                <CNavLink
                  href="#"
                  active={activeKey === "profile"}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveKey("profile");
                  }}
                >
                  Profile
                </CNavLink>
              </CNavItem>
              <CNavItem role="presentation">
                <CNavLink
                  href="#"
                  active={activeKey === "password"}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveKey("password");
                  }}
                >
                  Change Password
                </CNavLink>
              </CNavItem>
            </CNav>

            <CTabContent>
              {/* Profile Tab */}
              <CTabPane visible={activeKey === "profile"}>
                <CForm key={profileNonce} onSubmit={onSubmitProfile} autoComplete="off">
                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormInput
                        type="text"
                        name="first_name"
                        label="First Name"
                        value={profileForm.first_name}
                        onChange={onChangeProfile}
                        required
                        disabled={savingProfile || isLoading}
                      />
                    </CCol>
                    <CCol md={6}>
                      <CFormInput
                        type="text"
                        name="last_name"
                        label="Last Name"
                        value={profileForm.last_name}
                        onChange={onChangeProfile}
                        required
                        disabled={savingProfile || isLoading}
                      />
                    </CCol>
                    <CCol md={12}>
                      <CFormInput
                        type="email"
                        name="email"
                        label="Email"
                        value={profileForm.email}
                        disabled
                      />
                      <small className="text-muted">
                        Email is shown for reference and cannot be changed here.
                      </small>
                    </CCol>
                  </CRow>

                  <div className="d-flex gap-2 mt-4">
                    <CustomButton
                      actionType="secondary"
                      type="button"
                      onClick={() => navigate(-1)}
                      disabled={savingProfile}
                    >
                      Back
                    </CustomButton>
                    <CustomButton
                      actionType="save"
                      type="submit"
                      disabled={
                        savingProfile ||
                        isLoading ||
                        !profileForm.first_name.trim() ||
                        !profileForm.last_name.trim()
                      }
                    >
                      {savingProfile ? (
                        <>
                          <CSpinner size="sm" /> Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </CustomButton>
                  </div>
                </CForm>
              </CTabPane>

              {/* Password Tab */}
              <CTabPane visible={activeKey === "password"}>
                <CForm key={resetNonce} onSubmit={onSubmit} autoComplete="off">
                  <CFormInput
                    type="password"
                    name="current_password"
                    label="Current Password"
                    className="mb-3"
                    autoComplete="current-password"
                    value={form.current_password}
                    onChange={onChange}
                    required
                    disabled={submitting || isLoading}
                  />

                  <CFormInput
                    type="password"
                    name="new_password"
                    label="New Password"
                    className="mb-1"
                    autoComplete="new-password"
                    value={form.new_password}
                    onChange={onChange}
                    required
                    disabled={submitting || isLoading}
                  />
                  <small
                    className={`d-block mb-3 ${
                      !form.new_password
                        ? "text-muted"
                        : newPwdFeedback.ok
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {!form.new_password
                      ? "Must be at least 8 characters and include upper, lower and a number."
                      : newPwdFeedback.msg}
                  </small>

                  <CFormInput
                    type="password"
                    name="confirm_password"
                    label="Confirm New Password"
                    className="mb-1"
                    autoComplete="new-password"
                    value={form.confirm_password}
                    onChange={onChange}
                    required
                    disabled={submitting || isLoading}
                    invalid={!!form.confirm_password && !passwordsMatch}
                    valid={!!form.confirm_password && passwordsMatch}
                  />
                  <small
                    className={`d-block mb-3 ${
                      !form.confirm_password
                        ? "text-muted"
                        : passwordsMatch
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {!form.confirm_password
                      ? "Re-enter the new password."
                      : passwordsMatch
                      ? "Passwords match."
                      : "Passwords do not match."}
                  </small>

                  <div className="d-flex gap-2">
                    <CustomButton
                      actionType="secondary"
                      type="button"
                      onClick={() => navigate(-1)}
                      disabled={submitting}
                    >
                      Back
                    </CustomButton>
                    <CustomButton
                      actionType="save"
                      type="submit"
                      disabled={
                        submitting ||
                        isLoading ||
                        !form.current_password ||
                        !newPwdFeedback.ok ||
                        !passwordsMatch
                      }
                    >
                      {submitting ? (
                        <>
                          <CSpinner size="sm" /> Saving...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </CustomButton>
                  </div>
                </CForm>
              </CTabPane>
            </CTabContent>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default Profile;
