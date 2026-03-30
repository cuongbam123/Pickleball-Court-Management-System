import React from "react";
import MainLayout from "./MainLayout";

const UserLayout = ({ user, children }) => {
  return <MainLayout user={user}>{children}</MainLayout>;
};

export default UserLayout;