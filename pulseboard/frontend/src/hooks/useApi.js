import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

// Base URL for API requests. Defaults to the app's served prefix (BASE_URL,
// without trailing slash) so requests are prefixed correctly behind a
// path-based reverse proxy: "" for the Docker build (base "/"), or e.g.
// "/pulseboard" behind Replit's proxy. Both the Vite dev proxy and the
// production nginx reverse proxy forward the (prefixed) /api path to the
// backend. Set VITE_API_URL to point at a backend on another origin if needed.
const API_BASE =
  import.meta.env.VITE_API_URL ?? import.meta.env.BASE_URL.replace(/\/$/, "");

const client = axios.create({ baseURL: API_BASE });

function friendly(err) {
  return (
    err?.response?.data?.detail ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}

/** Fetches the last 10 briefs and auto-refreshes on an interval. */
export function useBriefs(intervalMs = 30000) {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timer = useRef(null);

  const refresh = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const { data } = await client.get("/api/briefs");
      setBriefs(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(friendly(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(() => refresh(true), intervalMs);
    return () => clearInterval(timer.current);
  }, [refresh, intervalMs]);

  return { briefs, loading, error, refresh };
}

/** Generates a brief from pasted/structured JSON data via POST /api/analyze. */
export function useGenerateBrief() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const generate = useCallback(async (data, dataSourceName) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data: res } = await client.post("/api/analyze", {
        data,
        data_source_name: dataSourceName,
      });
      setResult(res);
      return res;
    } catch (err) {
      setError(friendly(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, result, error };
}

/** Generates a brief from a CSV upload via POST /api/upload-csv. */
export function useUploadCSV() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const upload = useCallback(async (file, dataSourceName) => {
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData();
    form.append("file", file);
    if (dataSourceName) form.append("data_source_name", dataSourceName);
    try {
      const { data: res } = await client.post("/api/upload-csv", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res);
      return res;
    } catch (err) {
      setError(friendly(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, result, error };
}
