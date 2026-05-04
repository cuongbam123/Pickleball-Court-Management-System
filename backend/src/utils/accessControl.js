const toIdString = (value) => {
  if (value === null || value === undefined) return null;
  return value.toString();
};

const isAdmin = (user) => user?.role === "admin";
const isManager = (user) => user?.role === "manager";
const isStaff = (user) => user?.role === "staff";

const isAdminOrManager = (user) => isAdmin(user) || isManager(user);
const isStaffOrManager = (user) => isStaff(user) || isManager(user);
const isAdminStaffOrManager = (user) =>
  isAdmin(user) || isStaff(user) || isManager(user);

const assertHasBranchScope = (user) => {
  if (!toIdString(user?.branch_id)) {
    const error = new Error(
      "Tài khoản của bạn chưa được gán chi nhánh để thực hiện thao tác này",
    );
    error.statusCode = 403;
    throw error;
  }
};

const assertManagerBranchAccess = (
  user,
  targetBranchId,
  message = "Manager chỉ được thao tác trong chi nhánh của mình",
) => {
  if (!isManager(user)) return;

  assertHasBranchScope(user);
  if (!targetBranchId || toIdString(targetBranchId) !== toIdString(user.branch_id)) {
    const error = new Error(message);
    error.statusCode = 403;
    throw error;
  }
};

const assertStaffOrManagerBranchAccess = (
  user,
  targetBranchId,
  message = "Bạn chỉ được thao tác trong chi nhánh của mình",
) => {
  if (!isStaffOrManager(user)) return;

  assertHasBranchScope(user);
  if (!targetBranchId || toIdString(targetBranchId) !== toIdString(user.branch_id)) {
    const error = new Error(message);
    error.statusCode = 403;
    throw error;
  }
};

module.exports = {
  toIdString,
  isAdmin,
  isManager,
  isStaff,
  isAdminOrManager,
  isStaffOrManager,
  isAdminStaffOrManager,
  assertHasBranchScope,
  assertManagerBranchAccess,
  assertStaffOrManagerBranchAccess,
};
