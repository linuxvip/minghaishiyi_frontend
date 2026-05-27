import adminClient from "./client";
import { SystemConfigMap } from "../types/admin";

export const getSystemConfigsApi = () => adminClient.get<SystemConfigMap>("/admin-api/system-configs/");

export const updateSystemConfigsApi = (data: Partial<SystemConfigMap>) => adminClient.put("/admin-api/system-configs/", data);
