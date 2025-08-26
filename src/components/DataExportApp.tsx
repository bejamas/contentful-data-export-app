"use client";

import React, { useState, useEffect } from "react";
import {
  Heading,
  Card,
  Select,
  Button,
  Flex,
  Text,
  Spinner,
  Note,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  TextInput,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { PageAppSDK } from "@contentful/app-sdk";

interface ContentType {
  sys: {
    id: string;
    type: string;
  };
  name: string;
  description?: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
  }>;
}

interface Locale {
  code: string;
  name: string;
  default: boolean;
}

export const DataExportApp: React.FC = () => {
  const sdk = useSDK<PageAppSDK>();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [locales, setLocales] = useState<Locale[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
    []
  );
  const [selectedLocale, setSelectedLocale] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentEnvironment, setCurrentEnvironment] = useState<string>("");
  const [currentSpace, setCurrentSpace] = useState<string>("");

  // Filter content types based on search term
  const filteredContentTypes = contentTypes.filter(
    (ct) =>
      ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ct.sys.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current space and environment
        const space = await sdk.cma.space.get({});
        setCurrentSpace(space.sys.id);
        
        const environment = await sdk.cma.environment.get({});
        setCurrentEnvironment(environment.sys.id);

        // Fetch content types
        const contentTypesResponse = await sdk.cma.contentType.getMany({});
        const formattedContentTypes = contentTypesResponse.items.map((ct) => ({
          sys: {
            id: ct.sys.id,
            type: ct.sys.type,
          },
          name: ct.name,
          description: ct.description,
          fields: ct.fields.map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type,
            required: field.required || false,
          })),
        }));
        setContentTypes(formattedContentTypes);

        // Fetch locales
        const localesResponse = await sdk.cma.locale.getMany({});
        const formattedLocales = localesResponse.items.map((locale) => ({
          code: locale.code,
          name: locale.name,
          default: locale.default,
        }));
        setLocales(formattedLocales);

        // Set default locale
        const defaultLocale = formattedLocales.find((locale) => locale.default);
        if (defaultLocale) {
          setSelectedLocale(defaultLocale.code);
        }
      } catch (err) {
        setError("Failed to fetch content types and locales");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sdk.cma]);

  const handleContentTypeToggle = (contentTypeId: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(contentTypeId)
        ? prev.filter((id) => id !== contentTypeId)
        : [...prev, contentTypeId]
    );
  };

  const handleSelectAllContentTypes = () => {
    if (selectedContentTypes.length === filteredContentTypes.length) {
      setSelectedContentTypes([]);
    } else {
      setSelectedContentTypes(filteredContentTypes.map((ct) => ct.sys.id));
    }
  };

  const handleExport = async () => {
    if (selectedContentTypes.length === 0) {
      setError("Please select at least one content type");
      return;
    }

    if (!selectedLocale) {
      setError("Please select a locale");
      return;
    }

    if (!currentEnvironment) {
      setError("Environment information not available");
      return;
    }

    if (!currentSpace) {
      setError("Space information not available");
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentTypes: selectedContentTypes,
          locale: selectedLocale,
          environment: currentEnvironment,
          space: currentSpace,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `content-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Export failed. Please try again.");
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        style={{ height: "400px" }}
      >
        <Spinner size="large" />
        <Text marginLeft="spacingM">Loading content types and locales...</Text>
      </Flex>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Heading>Content Export Tool</Heading>
      <Text marginBottom="spacingL">
        Select content types and locale to export all content including
        references.
      </Text>

      {error && (
        <Note variant="negative" marginBottom="spacingL">
          {error}
        </Note>
      )}

      <Flex gap="spacingL" flexDirection="column">
        {/* Locale Selection */}
        <Card>
          <Heading size="medium" marginBottom="spacingM">
            Select Locale
          </Heading>
          <Select
            value={selectedLocale}
            onChange={(e: any) => setSelectedLocale(e.target.value)}
            isRequired
          >
            <option value="">Select a locale</option>
            {locales.map((locale) => (
              <option key={locale.code} value={locale.code}>
                {locale.name} {locale.default && "(Default)"}
              </option>
            ))}
          </Select>
        </Card>

        {/* Content Types Selection */}
        <Card>
          <Flex
            justifyContent="space-between"
            alignItems="center"
            marginBottom="spacingM"
          >
            <Heading size="medium">Select Content Types</Heading>
            <Button
              variant="secondary"
              size="small"
              onClick={handleSelectAllContentTypes}
            >
              {selectedContentTypes.length === filteredContentTypes.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </Flex>

          {/* Search Field */}
          <div style={{ marginBottom: "16px" }}>
            <TextInput
              placeholder="Search content types by name or ID..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              size="medium"
            />
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Select</TableCell>
                  <TableCell>Content Type</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContentTypes.map((contentType) => (
                  <TableRow key={contentType.sys.id}>
                    <TableCell className="content-center">
                      <input
                        type="checkbox"
                        checked={selectedContentTypes.includes(
                          contentType.sys.id
                        )}
                        onChange={() =>
                          handleContentTypeToggle(contentType.sys.id)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Flex
                        gap="spacingXs"
                        flexDirection="column"
                        alignItems="start"
                      >
                        {contentType.name}
                        <span className="rounded-md inline-block bg-gray-200 px-2 py-0.5 text-xs">
                          {contentType.sys.id}
                        </span>
                      </Flex>
                    </TableCell>
                    <TableCell>
                      <Text size="small">
                        {contentType.description || "No description"}
                      </Text>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Export Button */}
        <Card>
          <Flex justifyContent="space-between" alignItems="center">
            <div>
              <div>
                <Text fontWeight="fontWeightDemiBold">
                  {selectedContentTypes.length} content type(s) selected
                </Text>
              </div>

              <div>
                <Text>
                  Locale:{" "}
                  {locales.find((l) => l.code === selectedLocale)?.name ||
                    "Not selected"}
                </Text>
              </div>

              <div>
                <Text size="small" textColor="textSecondary">
                  Environment: {currentEnvironment || "Loading..."}
                </Text>
              </div>

              <div>
                <Text size="small" textColor="textSecondary">
                  Space: {currentSpace || "Loading..."}
                </Text>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleExport}
              disabled={
                isExporting ||
                selectedContentTypes.length === 0 ||
                !selectedLocale ||
                !currentEnvironment ||
                !currentSpace
              }
              startIcon={isExporting ? <Spinner size="small" /> : undefined}
            >
              {isExporting ? "Exporting..." : "Export Content"}
            </Button>
          </Flex>
        </Card>
      </Flex>
    </div>
  );
};
