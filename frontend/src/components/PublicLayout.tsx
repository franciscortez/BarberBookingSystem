import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import LandingNavbar from "../sections/user/home/LandingNavbar";
import LandingFooter from "../sections/user/home/LandingFooter";
import {
  TaskHeader,
  TaskFooter,
  TaskLoading,
} from "../sections/user/common/TaskChrome";
import "../styles/public-brand.css";

const PublicLayout: React.FC = () => {
  const pathname = useLocation().pathname;
  const isLanding = pathname === "/";
  const isTask = [
    "/login",
    "/signup",
    "/book",
    "/success",
    "/reschedule-booking",
    "/cancel-booking",
  ].includes(pathname);
  if (isTask)
    return (
      <div className="public-brand public-task">
        <a className="landing-skip" href="#main-content">
          Skip to content
        </a>
        <TaskHeader pathname={pathname} />
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<TaskLoading />}>
            <Outlet />
          </Suspense>
        </main>
        <TaskFooter />
      </div>
    );
  if (isLanding) {
    return (
      <div className="public-brand landing-page">
        <a className="landing-skip" href="#main-content">
          Skip to content
        </a>
        <LandingNavbar />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <LandingFooter />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden relative">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
export default PublicLayout;
