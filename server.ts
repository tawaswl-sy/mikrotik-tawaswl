import express from "express";
import http from "http";
import https from "https";
import path from "path";
import { createServer as createViteServer } from "vite";
import hotspotRoutes from "./src/routes/hotspot.routes";
import authRoutes from "./src/routes/auth.routes";
import routerRoutes from "./src/routes/router.routes";

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount Modular RouterOS Architecture Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/routers", routerRoutes);
app.use("/api/hotspot", hotspotRoutes);

// Helper for making RouterOS REST API HTTP/HTTPS requests
function makeRouterRequest(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  ssl?: boolean;
  path: string;
  method?: string;
  body?: any;
  timeoutMs?: number;
}): Promise<{ status: number; data: any; headers?: any }> {
  return new Promise((resolve, reject) => {
    const isSsl = options.ssl !== false;
    const protocol = isSsl ? https : http;
    const auth = Buffer.from(`${options.user}:${options.pass}`).toString("base64");

    const reqOptions: http.RequestOptions = {
      hostname: options.host,
      port: options.port || (isSsl ? 443 : 80),
      path: options.path,
      method: options.method || "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: options.timeoutMs || 5000,
    };

    if (isSsl) {
      (reqOptions as https.RequestOptions).rejectUnauthorized = false; // Support RouterOS self-signed certs
    }

    const req = protocol.request(reqOptions, (res) => {
      let rawData = "";
      res.setEncoding("utf8");

      res.on("data", (chunk) => {
        rawData += chunk;
      });

      res.on("end", () => {
        let parsedData = rawData;
        try {
          if (rawData.trim()) {
            parsedData = JSON.parse(rawData);
          }
        } catch {
          // keep as string if not JSON
        }
        resolve({
          status: res.statusCode || 200,
          data: parsedData,
          headers: res.headers,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`انتهت مهلة الاتصال بالراوتر (${options.host}:${options.port}) بعد ${options.timeoutMs || 5000}ms`));
    });

    req.on("error", (err: any) => {
      reject(err);
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// -------------------------------------------------------------
// 1. API: Test MikroTik RouterBOARD Connection
// -------------------------------------------------------------
app.post("/api/mikrotik/test-connection", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  if (!host || !user) {
    return res.status(400).json({ success: false, message: "يرجى تحديد عنوان الراوتر واسم المستخدم" });
  }

  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass: pass || "",
      ssl: ssl !== false,
      path: "/rest/system/resource",
      timeoutMs: 4500,
    });

    if (result.status >= 200 && result.status < 300) {
      return res.json({
        success: true,
        live: true,
        data: result.data,
        message: "تم الاتصال بالراوتربورد بنجاح وجلب البيانات الحية!",
      });
    } else {
      return res.status(result.status).json({
        success: false,
        live: false,
        message: `استجاب الراوتر برمز الخطأ HTTP ${result.status}`,
        details: result.data,
      });
    }
  } catch (err: any) {
    console.warn(`[MikroTik Test] Could not reach hardware router at ${host}:${port}:`, err.message);
    return res.json({
      success: false,
      live: false,
      isUnreachable: true,
      error: err.message,
      message: `تعذر الاتصال بالراوتر الفيزيائي (${host}:${port}). يرجى التأكد من تفعيل خدمة REST API في الراوتر عبر الأمر: /ip service set www-ssl port=443 disabled=no`,
    });
  }
});

// -------------------------------------------------------------
// 2. API: Fetch Real System Resource & Hardware Info
// -------------------------------------------------------------
app.post("/api/mikrotik/resources", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  if (!host) {
    return res.status(400).json({ success: false, message: "Host required" });
  }

  try {
    const [resResource, resRouterboard, resHealth] = await Promise.allSettled([
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/system/resource" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/system/routerboard" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/system/health" }),
    ]);

    const resourceData = resResource.status === "fulfilled" && resResource.value.status === 200 ? resResource.value.data : null;
    const rbData = resRouterboard.status === "fulfilled" && resRouterboard.value.status === 200 ? resRouterboard.value.data : null;
    const healthData = resHealth.status === "fulfilled" && resHealth.value.status === 200 ? resHealth.value.data : null;

    if (resourceData) {
      return res.json({
        success: true,
        live: true,
        data: {
          uptime: resourceData.uptime || "1d 04h 12m",
          version: resourceData.version || "RouterOS v7.14.3",
          cpuLoad: parseInt(resourceData["cpu-load"] || resourceData.cpu_load || "18", 10),
          freeMemory: parseInt(resourceData["free-memory"] || "1500000000", 10),
          totalMemory: parseInt(resourceData["total-memory"] || "4294967296", 10),
          boardName: rbData?.model || resourceData["board-name"] || "CCR2004-16G-2S+",
          cpuCount: resourceData["cpu-count"] || 4,
          architecture: resourceData["architecture-name"] || "arm64",
          health: healthData,
        },
      });
    }

    throw new Error("Unable to fetch resource data from router");
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 3. API: Fetch Real Hotspot Users & Active Sessions
// -------------------------------------------------------------
app.post("/api/mikrotik/hotspot/data", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const [resUsers, resActive, resProfiles] = await Promise.allSettled([
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ip/hotspot/user" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ip/hotspot/active" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ip/hotspot/user/profile" }),
    ]);

    const users = resUsers.status === "fulfilled" && resUsers.value.status === 200 ? resUsers.value.data : [];
    const active = resActive.status === "fulfilled" && resActive.value.status === 200 ? resActive.value.data : [];
    const profiles = resProfiles.status === "fulfilled" && resProfiles.value.status === 200 ? resProfiles.value.data : [];

    return res.json({
      success: true,
      live: Array.isArray(users) && users.length > 0,
      users,
      active,
      profiles,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 4. API: Add Hotspot User on Real RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/hotspot/add-user", async (req, res) => {
  const { host, port, user, pass, ssl, userData } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/ip/hotspot/user",
      method: "PUT",
      body: {
        name: userData.username,
        password: userData.pass,
        profile: userData.profile || "default",
        comment: userData.comment || "Created via Tawaswl Web App",
      },
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      data: result.data,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 4b. API: Delete Hotspot User on Real RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/hotspot/delete-user", async (req, res) => {
  const { host, port, user, pass, ssl, username, userId } = req.body;
  try {
    const target = userId || username;
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ip/hotspot/user/${encodeURIComponent(target)}`,
      method: "DELETE",
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      message: `تم حذف مستخدم الهوتسبوت (${username || userId}) بنجاح من الراوتر`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 4c. API: Batch Generate Hotspot Users on RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/hotspot/batch-create", async (req, res) => {
  const { host, port, user, pass, ssl, users } = req.body;
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ success: false, message: "No users provided" });
  }

  try {
    let successCount = 0;
    for (const u of users) {
      try {
        await makeRouterRequest({
          host,
          port: Number(port) || 443,
          user,
          pass,
          ssl,
          path: "/rest/ip/hotspot/user",
          method: "PUT",
          body: {
            name: u.username,
            password: u.pass,
            profile: u.profile || "default",
            comment: u.comment || "Batch generated via Tawaswl",
          },
          timeoutMs: 3000,
        });
        successCount++;
      } catch (e) {
        // continue batch
      }
    }

    return res.json({
      success: true,
      live: true,
      count: successCount,
      total: users.length,
      message: `تم إنشاء ${successCount} من أصل ${users.length} كرت بنجاح على سيرفر المايكروتك!`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 5. API: Fetch Real PPPoE Secrets & Active Sessions
// -------------------------------------------------------------
app.post("/api/mikrotik/pppoe/data", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const [resSecrets, resActive] = await Promise.allSettled([
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ppp/secret" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ppp/active" }),
    ]);

    const secrets = resSecrets.status === "fulfilled" && resSecrets.value.status === 200 ? resSecrets.value.data : [];
    const active = resActive.status === "fulfilled" && resActive.value.status === 200 ? resActive.value.data : [];

    return res.json({
      success: true,
      live: Array.isArray(secrets) && secrets.length > 0,
      secrets,
      active,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 5b. API: Add PPPoE Secret on Real RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/pppoe/add-secret", async (req, res) => {
  const { host, port, user, pass, ssl, secretData } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/ppp/secret",
      method: "PUT",
      body: {
        name: secretData.username,
        password: secretData.pass,
        service: "pppoe",
        profile: secretData.profile || "default",
        "local-address": secretData.localIp || "10.10.10.1",
        "remote-address": secretData.remoteIp || "",
        comment: secretData.callerId || "PPPoE client created via Tawaswl",
      },
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      data: result.data,
      message: "تم حفظ اشتراك الـ PPPoE بنجاح على الراوتر!",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 5c. API: Delete PPPoE Secret on Real RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/pppoe/delete-secret", async (req, res) => {
  const { host, port, user, pass, ssl, username, secretId } = req.body;
  try {
    const target = secretId || username;
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ppp/secret/${encodeURIComponent(target)}`,
      method: "DELETE",
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      message: `تم حذف اشتراك البرودباند (${username || secretId}) بنجاح`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 5d. API: Kick / Disconnect Active PPPoE Session
// -------------------------------------------------------------
app.post("/api/mikrotik/pppoe/kick-active", async (req, res) => {
  const { host, port, user, pass, ssl, activeId } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ppp/active/${encodeURIComponent(activeId)}`,
      method: "DELETE",
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      message: "تم فصل جلسة PPPoE النشطة للعميل بنجاح",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 6. API: Fetch Real Interfaces & Traffic Statistics
// -------------------------------------------------------------
app.post("/api/mikrotik/interfaces", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/interface",
    });

    return res.json({
      success: true,
      live: result.status === 200,
      interfaces: Array.isArray(result.data) ? result.data : [],
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 7. API: Kick / Disconnect Active Hotspot Client
// -------------------------------------------------------------
app.post("/api/mikrotik/hotspot/kick-user", async (req, res) => {
  const { host, port, user, pass, ssl, activeId } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ip/hotspot/active/${encodeURIComponent(activeId)}`,
      method: "DELETE",
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      message: "تم فصل جلسة المستخدم بنجاح من الراوتر",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 8. API: Execute RouterOS CLI / REST Command
// -------------------------------------------------------------
app.post("/api/mikrotik/cli", async (req, res) => {
  const { host, port, user, pass, ssl, command } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: "Command is required" });
  }

  const cleanCmd = command.trim();
  let apiPath = "/rest/system/resource";
  let method = "GET";
  let bodyData: any = undefined;

  // Smart mapping from RouterOS CLI syntax to REST API path
  if (cleanCmd.startsWith("/ip hotspot user")) {
    apiPath = "/rest/ip/hotspot/user";
  } else if (cleanCmd.startsWith("/ip hotspot active")) {
    apiPath = "/rest/ip/hotspot/active";
  } else if (cleanCmd.startsWith("/ip neighbor") || cleanCmd.startsWith("/ip/neighbor")) {
    apiPath = "/rest/ip/neighbor";
  } else if (cleanCmd.startsWith("/ppp secret") || cleanCmd.startsWith("/interface pppoe-server")) {
    apiPath = "/rest/ppp/secret";
  } else if (cleanCmd.startsWith("/ppp active")) {
    apiPath = "/rest/ppp/active";
  } else if (cleanCmd.startsWith("/interface")) {
    apiPath = "/rest/interface";
  } else if (cleanCmd.startsWith("/ip dhcp-server lease")) {
    apiPath = "/rest/ip/dhcp-server/lease";
  } else if (cleanCmd.startsWith("/log")) {
    apiPath = "/rest/log";
  } else if (cleanCmd.startsWith("/system resource") || cleanCmd.startsWith("/system/resource")) {
    apiPath = "/rest/system/resource";
  } else if (cleanCmd.startsWith("/system routerboard")) {
    apiPath = "/rest/system/routerboard";
  } else if (cleanCmd.startsWith("/system identity")) {
    apiPath = "/rest/system/identity";
  } else if (cleanCmd.startsWith("/ping")) {
    apiPath = "/rest/ping";
    method = "POST";
    const parts = cleanCmd.split(" ");
    bodyData = { address: parts[1] || "8.8.8.8", count: 4 };
  } else {
    // If it starts with /rest/, use directly
    if (cleanCmd.startsWith("/rest/")) {
      apiPath = cleanCmd;
    }
  }

  try {
    const result = await makeRouterRequest({
      host: host || "192.168.88.1",
      port: Number(port) || 443,
      user: user || "admin",
      pass: pass || "",
      ssl: ssl !== false,
      path: apiPath,
      method,
      body: bodyData,
      timeoutMs: 5000,
    });

    return res.json({
      success: true,
      live: true,
      path: apiPath,
      statusCode: result.status,
      data: result.data,
    });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      live: false,
      path: apiPath,
      error: err.message,
      message: `تعذر تنفيذ الأمر على الراوتر (${host}:${port}): ${err.message}`,
    });
  }
});

// -------------------------------------------------------------
// 9. API: Fetch System Logs
// -------------------------------------------------------------
app.post("/api/mikrotik/logs", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/log",
    });

    if (result.status === 200 && Array.isArray(result.data)) {
      return res.json({ success: true, live: true, logs: result.data });
    }
    return res.json({ success: true, live: true, logs: [] });
  } catch (err: any) {
    return res.json({ success: false, live: false, logs: [], error: err.message });
  }
});

// -------------------------------------------------------------
// 10. API: Fetch DHCP Server Leases
// -------------------------------------------------------------
app.post("/api/mikrotik/dhcp/leases", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/ip/dhcp-server/lease",
    });

    if (result.status === 200 && Array.isArray(result.data)) {
      return res.json({ success: true, live: true, data: result.data });
    }
    return res.json({ success: true, live: true, data: [] });
  } catch (err: any) {
    return res.json({ success: false, live: false, data: [], error: err.message });
  }
});

// -------------------------------------------------------------
// 10b. API: Make DHCP Lease Static on RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/dhcp/make-static", async (req, res) => {
  const { host, port, user, pass, ssl, leaseId } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ip/dhcp-server/lease/make-static`,
      method: "POST",
      body: { numbers: leaseId },
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      message: "تم تثبيت حجز الـ IP على راوتر مايكروتك بنجاح",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 10c. API: Add Static DHCP Lease on RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/dhcp/add-lease", async (req, res) => {
  const { host, port, user, pass, ssl, lease } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/ip/dhcp-server/lease",
      method: "PUT",
      body: {
        address: lease.ip,
        "mac-address": lease.mac,
        server: lease.server || "dhcp-lan",
        comment: lease.hostname || "Static lease created via Tawaswl",
      },
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      data: result.data,
      message: "تم إضافة وتثبيت حجز DHCP على الراوتر بنجاح",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 10d. API: Delete DHCP Lease on RouterBOARD
// -------------------------------------------------------------
app.post("/api/mikrotik/dhcp/delete-lease", async (req, res) => {
  const { host, port, user, pass, ssl, leaseId } = req.body;
  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: `/rest/ip/dhcp-server/lease/${encodeURIComponent(leaseId)}`,
      method: "DELETE",
    });

    return res.json({
      success: result.status >= 200 && result.status < 300,
      live: true,
      message: "تم حذف حجز DHCP بنجاح من الراوتر",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 11. API: Fetch Connected Neighbors & Hotspot Hosts (MNDP / CDP / LLDP & IP Hotspot Host)
// -------------------------------------------------------------
app.post("/api/mikrotik/neighbors", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    const [resNeighbors, resHotspotHosts] = await Promise.allSettled([
      makeRouterRequest({
        host,
        port: Number(port) || 443,
        user,
        pass,
        ssl,
        path: "/rest/ip/neighbor",
      }),
      makeRouterRequest({
        host,
        port: Number(port) || 443,
        user,
        pass,
        ssl,
        path: "/rest/ip/hotspot/host",
      }),
    ]);

    const neighbors = resNeighbors.status === "fulfilled" && resNeighbors.value.status === 200 && Array.isArray(resNeighbors.value.data)
      ? resNeighbors.value.data
      : [];

    const hotspotHosts = resHotspotHosts.status === "fulfilled" && resHotspotHosts.value.status === 200 && Array.isArray(resHotspotHosts.value.data)
      ? resHotspotHosts.value.data
      : [];

    return res.json({
      success: true,
      live: neighbors.length > 0 || hotspotHosts.length > 0,
      neighbors,
      hotspotHosts,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      neighbors: [],
      hotspotHosts: [],
      error: err.message,
    });
  }
});

// -------------------------------------------------------------
// 13. API: Generate MikroTik RouterOS .rsc Script Backup
// -------------------------------------------------------------
app.post("/api/mikrotik/system/backup-rsc", async (req, res) => {
  const { routerName, host, users, pppoeSecrets } = req.body;
  const dateStr = new Date().toISOString();
  let rscScript = `# ========================================================\n`;
  rscScript += `# MikroTik RouterOS v7 Configuration Script Export\n`;
  rscScript += `# Router Name: ${routerName || "CCR2004-Core"}\n`;
  rscScript += `# Generated on: ${dateStr}\n`;
  rscScript += `# Generated by: Tawaswl MikroTik ISP Control Center\n`;
  rscScript += `# ========================================================\n\n`;

  rscScript += `/system identity set name="${routerName || "CCR2004-Core"}"\n\n`;
  rscScript += `/ip hotspot user profile\n`;
  rscScript += `add name="30GB" rate-limit="25M/10M" shared-users=1 status-autorefresh=1m\n`;
  rscScript += `add name="50GB" rate-limit="50M/20M" shared-users=1 status-autorefresh=1m\n`;
  rscScript += `add name="100GB" rate-limit="100M/30M" shared-users=1 status-autorefresh=1m\n`;
  rscScript += `add name="Unlimited" rate-limit="200M/50M" shared-users=2 status-autorefresh=1m\n\n`;

  if (Array.isArray(users) && users.length > 0) {
    rscScript += `/ip hotspot user\n`;
    users.forEach((u: any) => {
      rscScript += `add name="${u.username}" password="${u.pass}" profile="${u.profile || "30GB"}" comment="Tawaswl Export"\n`;
    });
    rscScript += `\n`;
  }

  if (Array.isArray(pppoeSecrets) && pppoeSecrets.length > 0) {
    rscScript += `/ppp profile\n`;
    rscScript += `add name="50Mbps Fiber" local-address=10.10.10.1 rate-limit="50M/20M"\n`;
    rscScript += `add name="100Mbps Dedicated" local-address=10.10.10.1 rate-limit="100M/30M"\n\n`;
    rscScript += `/ppp secret\n`;
    pppoeSecrets.forEach((s: any) => {
      rscScript += `add name="${s.username}" password="${s.pass}" profile="${s.profile || "50Mbps Fiber"}" service=pppoe local-address="${s.localIp || "10.10.10.1"}" remote-address="${s.remoteIp || ""}" comment="${s.callerId || "Tawaswl PPPoE"}"\n`;
    });
    rscScript += `\n`;
  }

  return res.json({
    success: true,
    script: rscScript,
    filename: `tawaswl_${(routerName || "mikrotik").replace(/\s+/g, "_")}_${Date.now()}.rsc`,
  });
});

// -------------------------------------------------------------
// 14. API: Telegram Bot Forwarding / Sending Proxy
// -------------------------------------------------------------
app.post("/api/telegram/send-message", async (req, res) => {
  const { botToken, chatId, text, parseMode } = req.body;
  if (!botToken || !chatId || !text) {
    return res.status(400).json({ success: false, message: "Missing botToken, chatId, or text" });
  }

  try {
    const postData = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode || "HTML",
    });

    const options: https.RequestOptions = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      timeout: 8000,
    };

    const telegramReq = https.request(options, (tgRes) => {
      let data = "";
      tgRes.on("data", (chunk) => (data += chunk));
      tgRes.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.ok) {
            return res.json({ success: true, result: parsed.result });
          } else {
            return res.json({ success: false, description: parsed.description });
          }
        } catch {
          return res.json({ success: true, raw: data });
        }
      });
    });

    telegramReq.on("error", (e) => {
      return res.json({ success: false, error: e.message });
    });

    telegramReq.on("timeout", () => {
      telegramReq.destroy();
      return res.json({ success: false, error: "Telegram API request timeout" });
    });

    telegramReq.write(postData);
    telegramReq.end();
  } catch (err: any) {
    return res.json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. API: Ping Diagnostics Endpoint
// -------------------------------------------------------------
app.post("/api/mikrotik/tool/ping", async (req, res) => {
  const { host, port, user, pass, ssl, targetIp, count } = req.body;
  const target = targetIp || "8.8.8.8";
  const pCount = Number(count) || 4;

  try {
    const result = await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/ping",
      method: "POST",
      body: { address: target, count: pCount },
    });

    if (result.status === 200) {
      return res.json({ success: true, live: true, data: result.data });
    }
    throw new Error(`Ping failed with status HTTP ${result.status}`);
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      live: false,
      target,
      error: err.message,
      message: `تعذر الاتصال بالهدف ${target} عبر الراوتر: ${err.message}`,
      summary: {
        sent: pCount,
        received: 0,
        packetLoss: "100%",
        minRtt: "--",
        avgRtt: "--",
        maxRtt: "--",
      },
    });
  }
});

// -------------------------------------------------------------
// 12. API: Router Reboot Endpoint
// -------------------------------------------------------------
app.post("/api/mikrotik/system/reboot", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  try {
    await makeRouterRequest({
      host,
      port: Number(port) || 443,
      user,
      pass,
      ssl,
      path: "/rest/system/reboot",
      method: "POST",
    });
    return res.json({ success: true, message: "تم إرسال أمر إعادة التشغيل إلى الراوتر بنجاح" });
  } catch (err: any) {
    return res.status(502).json({
      success: false,
      error: err.message,
      message: `تعذر إرسال أمر إعادة التشغيل إلى الراوتر: ${err.message}`,
    });
  }
});

// -------------------------------------------------------------
// 8. API: Sync-All Master Endpoint
// -------------------------------------------------------------
app.post("/api/mikrotik/sync-all", async (req, res) => {
  const { host, port, user, pass, ssl } = req.body;
  if (!host) {
    return res.status(400).json({ success: false, message: "Missing router host" });
  }

  try {
    const [resRes, resHSUsers, resHSActive, resPPPSecrets, resPPPActive, resIfaces] = await Promise.allSettled([
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/system/resource" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ip/hotspot/user" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ip/hotspot/active" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ppp/secret" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/ppp/active" }),
      makeRouterRequest({ host, port: Number(port) || 443, user, pass, ssl, path: "/rest/interface" }),
    ]);

    const resource = resRes.status === "fulfilled" && resRes.value.status === 200 ? resRes.value.data : null;
    const hsUsers = resHSUsers.status === "fulfilled" && resHSUsers.value.status === 200 ? resHSUsers.value.data : [];
    const hsActive = resHSActive.status === "fulfilled" && resHSActive.value.status === 200 ? resHSActive.value.data : [];
    const pppSecrets = resPPPSecrets.status === "fulfilled" && resPPPSecrets.value.status === 200 ? resPPPSecrets.value.data : [];
    const pppActive = resPPPActive.status === "fulfilled" && resPPPActive.value.status === 200 ? resPPPActive.value.data : [];
    const ifaces = resIfaces.status === "fulfilled" && resIfaces.value.status === 200 ? resIfaces.value.data : [];

    const isLive = resource !== null;

    if (!isLive && hsUsers.length === 0 && pppSecrets.length === 0 && ifaces.length === 0) {
      return res.status(502).json({
        success: false,
        live: false,
        message: `تعذر الاتصال بالراوتر (${host}:${port}). يرجى التأكد من تشغيل الراوتر وتفعيل REST API وصحة اسم المستخدم وكلمة المرور.`,
      });
    }

    return res.json({
      success: true,
      live: isLive,
      data: {
        resource,
        hotspotUsers: hsUsers,
        hotspotActive: hsActive,
        pppoeSecrets: pppSecrets,
        pppoeActive: pppActive,
        interfaces: ifaces,
      },
      message: "تمت المزامنة بنجاح من الراوتربورد المباشر!",
    });
  } catch (err: any) {
    return res.json({
      success: false,
      live: false,
      error: err.message,
    });
  }
});

// Vite Middleware and Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MikroTik ISP Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
