"use client";

import React from "react";
import { DataExportApp } from "../components/DataExportApp";
import { SDKProvider } from "@contentful/react-apps-toolkit";

export default function HomePage() {
  return (
    <SDKProvider>
      <DataExportApp />
    </SDKProvider>
  );
}
