"use client";

import dynamic from "next/dynamic";
import type { RefreshManager } from "./modules/moduleTypes";

type RefreshModuleProps = {
  manager: RefreshManager;
};

const moduleLoaderFallback = () => (
  <div className="min-h-[260px] rounded-[8px] border border-[#d7e3f1] bg-white/70" aria-hidden="true" />
);

const ContentModules = dynamic<RefreshModuleProps>(
  () => import("./modules/ContentModules").then((module) => module.ContentModules),
  {
    loading: moduleLoaderFallback,
    ssr: false
  }
);

const DesignModules = dynamic<RefreshModuleProps>(
  () => import("./modules/DesignModules").then((module) => module.DesignModules),
  {
    loading: moduleLoaderFallback,
    ssr: false
  }
);

const AccessModules = dynamic<RefreshModuleProps>(
  () => import("./modules/AccessModules").then((module) => module.AccessModules),
  {
    loading: moduleLoaderFallback,
    ssr: false
  }
);

const UserModules = dynamic<RefreshModuleProps>(
  () => import("./modules/UserModules").then((module) => module.UserModules),
  {
    loading: moduleLoaderFallback,
    ssr: false
  }
);

const SystemModules = dynamic<RefreshModuleProps>(
  () => import("./modules/SystemModules").then((module) => module.SystemModules),
  {
    loading: moduleLoaderFallback,
    ssr: false
  }
);

export function RefreshModules(props: { manager: RefreshManager }) {
  const { view } = props.manager;

  if (["content-list", "content-editor", "sections-tree", "section-editor"].includes(view)) {
    return <ContentModules manager={props.manager} />;
  }

  if (["masks", "templates", "elements"].includes(view)) {
    return <DesignModules manager={props.manager} />;
  }

  if (["permissions", "groups"].includes(view)) {
    return <AccessModules manager={props.manager} />;
  }

  if (view === "users") {
    return <UserModules manager={props.manager} />;
  }

  return <SystemModules manager={props.manager} />;
}
