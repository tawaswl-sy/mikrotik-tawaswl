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
function generateSimulatedRouterOutput(command: string): string {
  const clean = command.trim();
  const lower = clean.startsWith("/") ? clean.slice(1).toLowerCase().trim() : clean.toLowerCase().trim();

  if (lower.startsWith("system resource") || lower === "system resource print") {
    return [
      "                   uptime: 42w3d14h22m",
      "                  version: 7.14.3 (stable)",
      "               build-time: Feb/28/2024 10:14:22",
      "         factory-software: 7.6",
      "              free-memory: 3.4GiB",
      "             total-memory: 4.0GiB",
      "                      cpu: Annapurna Labs Alpine AL32400",
      "                cpu-count: 4",
      "            cpu-frequency: 1700MHz",
      "                 cpu-load: 12%",
      "           free-hdd-space: 112.5MiB",
      "          total-hdd-space: 128.0MiB",
      "  write-sect-since-reboot: 18294",
      "         write-sect-total: 248102",
      "               bad-blocks: 0%",
      "        architecture-name: arm64",
      "               board-name: CCR2004-16G-2S+",
      "                 platform: MikroTik"
    ].join("\n");
  }

  if (lower.startsWith("system routerboard") || lower === "system routerboard print") {
    return [
      "       routerboard: yes",
      "             model: CCR2004-16G-2S+",
      "     serial-number: HEE089F5C71",
      "     firmware-type: al32400",
      "  factory-firmware: 7.6",
      "  current-firmware: 7.14.3",
      "  upgrade-firmware: 7.14.3"
    ].join("\n");
  }

  if (lower.startsWith("system identity") || lower === "system identity print") {
    return "name: CCR2004-16G-2S+";
  }

  if (lower.startsWith("system clock") || lower === "system clock print") {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    return [
      `                  time: ${timeStr}`,
      `                  date: sep/25/2026`,
      `  time-zone-autodetect: yes`,
      `        time-zone-name: Asia/Baghdad`,
      `            gmt-offset: +03:00`,
      `            dst-active: no`
    ].join("\n");
  }

  if (lower.startsWith("system package") || lower === "system package print") {
    return [
      "Flags: X - disabled",
      " #   NAME                    VERSION    BUILD-TIME",
      " 0   routeros                7.14.3     Feb/28/2024 10:14:22",
      " 1   wireless                7.14.3     Feb/28/2024 10:14:22",
      " 2   user-manager            7.14.3     Feb/28/2024 10:14:22"
    ].join("\n");
  }

  if (lower.startsWith("system health") || lower === "system health print") {
    return [
      "Flags: X - disabled",
      " #   NAME           VALUE  TYPE",
      " 0   voltage        24.2   V   ",
      " 1   temperature    38     C   ",
      " 2   cpu-temperature 44    C   "
    ].join("\n");
  }

  if (lower.startsWith("interface ethernet") || lower === "interface ethernet print") {
    return [
      "Flags: X - disabled, R - running, S - slave",
      " #     NAME            MTU   MAC-ADDRESS       SPEED   DUPLEX",
      " 0  R  ether1-WAN     1500  48:8F:5A:11:22:01 1Gbps   full  ",
      " 1  RS ether2-LAN     1500  48:8F:5A:11:22:02 1Gbps   full  ",
      " 2  RS ether3-LAN     1500  48:8F:5A:11:22:03 1Gbps   full  ",
      " 3  RS ether4-LAN     1500  48:8F:5A:11:22:04 1Gbps   full  ",
      " 4  R  sfp-sfpplus1  10000  48:8F:5A:11:22:05 10Gbps  full  "
    ].join("\n");
  }

  if (lower.startsWith("interface") || lower === "interface print") {
    return [
      "Flags: D - dynamic, X - disabled, R - running, S - slave",
      " #     NAME                                TYPE       ACTUAL-MTU",
      " 0  R  ether1-WAN                          ether            1500",
      " 1  RS ether2-LAN                          ether            1500",
      " 2  RS ether3-LAN                          ether            1500",
      " 3  RS ether4-LAN                          ether            1500",
      " 4  R  sfp-sfpplus1                        ether           10000",
      " 5  R  bridge-local                        bridge           1500",
      " 6  R  bridge1-Hotspot                     bridge           1500"
    ].join("\n");
  }

  if (lower.startsWith("ip address") || lower === "ip address print") {
    return [
      "Flags: X - disabled, I - invalid, D - dynamic, P - primary",
      " #   ADDRESS            NETWORK         INTERFACE",
      " 0 P 192.168.88.1/24    192.168.88.0    bridge-local",
      " 1   10.10.10.1/24      10.10.10.0      bridge1-Hotspot",
      " 2 D 196.200.45.18/28   196.200.45.16   ether1-WAN"
    ].join("\n");
  }

  if (lower.startsWith("ip route") || lower === "ip route print") {
    return [
      "Flags: D - dynamic, A - active, C - connect, S - static, v - vpn",
      " #      DST-ADDRESS        GATEWAY         DISTANCE",
      " 0 A S  0.0.0.0/0          196.200.45.17          1",
      " 1 ADC  10.10.10.0/24      bridge1-Hotspot        0",
      " 2 ADC  192.168.88.0/24    bridge-local           0",
      " 3 ADC  196.200.45.16/28   ether1-WAN             0"
    ].join("\n");
  }

  if (lower.startsWith("ip pool") || lower === "ip pool print") {
    return [
      " # NAME              RANGES                         ",
      " 0 dhcp-pool-lan     192.168.88.100-192.168.88.254  ",
      " 1 hotspot-pool      10.10.10.10-10.10.10.250       ",
      " 2 pppoe-pool        172.16.1.100-172.16.1.250      "
    ].join("\n");
  }

  if (lower.startsWith("ip dns") || lower === "ip dns print") {
    return [
      "                  servers: 8.8.8.8,1.1.1.1,8.8.4.4",
      "          dynamic-servers: 196.200.45.1",
      "           use-doh-server: ",
      "          verify-doh-cert: no",
      "    allow-remote-requests: yes",
      "               cache-size: 4096KiB",
      "            cache-max-ttl: 1w",
      "               cache-used: 328KiB"
    ].join("\n");
  }

  if (lower.startsWith("ip arp") || lower === "ip arp print") {
    return [
      "Flags: X - disabled, I - invalid, H - DHCP, D - dynamic, P - published",
      " #    ADDRESS          MAC-ADDRESS       INTERFACE",
      " 0 DH 192.168.88.100   74:D4:35:88:12:44 bridge-local",
      " 1 DH 192.168.88.105   F8:1E:DF:44:99:A1 bridge-local",
      " 2  D 10.10.10.45      B4:B0:24:99:31:02 bridge1-Hotspot",
      " 3  D 10.10.10.82      DC:A6:32:11:88:99 bridge1-Hotspot"
    ].join("\n");
  }

  if (lower.startsWith("ip neighbor") || lower === "ip neighbor print") {
    return [
      " # INTERFACE   ADDRESS         MAC-ADDRESS       IDENTITY       VERSION",
      " 0 ether1-WAN  196.200.45.17   6C:3B:6B:44:91:20 ISP-Gateway    7.14",
      " 1 ether2-LAN  192.168.88.2    48:8F:5A:CC:11:02 Switch-Core-01 7.12",
      " 2 ether3-LAN  192.168.88.3    48:8F:5A:EE:22:04 AP-Sector-East 7.13"
    ].join("\n");
  }

  if (lower.startsWith("ip dhcp-server lease") || lower === "ip dhcp-server lease print") {
    return [
      "Flags: X - disabled, R - radius, D - dynamic, B - blocked",
      " #   ADDRESS         MAC-ADDRESS       HOST-NAME          SERVER",
      " 0 D 192.168.88.100  74:D4:35:88:12:44 iPhone-14-Pro      dhcp-lan",
      " 1 D 192.168.88.105  F8:1E:DF:44:99:A1 MacBook-Air-M2    dhcp-lan",
      " 2   192.168.88.20   00:11:32:99:88:77 Printer-Office     dhcp-lan",
      " 3 D 192.168.88.112  BC:D0:74:22:33:44 Samsung-S23-Ultra  dhcp-lan"
    ].join("\n");
  }

  if (lower.startsWith("ip dhcp-server") || lower === "ip dhcp-server print") {
    return [
      "Flags: X - disabled, I - invalid",
      " #   NAME       INTERFACE     RELAY  ADDRESS-POOL   LEASE-TIME  ADD-ARP",
      " 0   dhcp-lan   bridge-local         dhcp-pool-lan  3d          yes    "
    ].join("\n");
  }

  if (lower.startsWith("ip firewall filter") || lower === "ip firewall filter print") {
    return [
      "Flags: X - disabled, I - invalid, D - dynamic",
      " 0  D ;;; special dummy rule to show fasttrack counters",
      "      chain=forward action=passthrough",
      "",
      " 1    ;;; defconf: accept established,related,untracked",
      "      chain=input action=accept connection-state=established,related,untracked",
      "",
      " 2    ;;; defconf: drop invalid",
      "      chain=input action=drop connection-state=invalid",
      "",
      " 3    ;;; defconf: accept ICMP",
      "      chain=input action=accept protocol=icmp",
      "",
      " 4    ;;; defconf: drop all not coming from LAN",
      "      chain=input action=drop in-interface-list=!LAN"
    ].join("\n");
  }

  if (lower.startsWith("ip firewall nat") || lower === "ip firewall nat print") {
    return [
      "Flags: X - disabled, I - invalid, D - dynamic",
      " 0    ;;; defconf: masquerade",
      "      chain=srcnat action=masquerade out-interface-list=WAN ipsec-policy=out,none",
      " 1    ;;; hotspot masquerade",
      "      chain=srcnat action=masquerade src-address=10.10.10.0/24"
    ].join("\n");
  }

  if (lower.startsWith("ip hotspot user") || lower === "ip hotspot user print") {
    return [
      "Flags: X - disabled, D - dynamic",
      " #   SERVER        NAME          PROFILE     UPTIME   BYTES-IN    BYTES-OUT",
      " 0   all           user_88201    prof-50g    2h15m    450.2MiB    2.1GiB",
      " 1   all           card_vip_94   prof-unlim  5h40m    1.2GiB      8.4GiB",
      " 2   all           test_guest    prof-10g    35m      85.4MiB     210.8MiB",
      " 3   all           vip_ahmed     prof-unlim  1d4h     3.1GiB      22.5GiB"
    ].join("\n");
  }

  if (lower.startsWith("ip hotspot active") || lower === "ip hotspot active print") {
    return [
      "Flags: R - radius",
      " #   SERVER   USER         ADDRESS      MAC-ADDRESS       UPTIME   BYTES-IN",
      " 0   hs-pool  user_88201   10.10.10.45  B4:B0:24:99:31:02 2h15m    450.2MiB",
      " 1   hs-pool  card_vip_94  10.10.10.82  DC:A6:32:11:88:99 5h40m    1.2GiB",
      " 2   hs-pool  vip_ahmed    10.10.10.12  74:D4:35:88:12:44 1d4h     3.1GiB"
    ].join("\n");
  }

  if (lower.startsWith("ppp secret") || lower === "ppp secret print") {
    return [
      "Flags: X - disabled",
      " #   NAME           SERVICE  CALLER-ID         PROFILE       LOCAL-ADDRESS  REMOTE-ADDRESS",
      " 0   pppoe_user01   pppoe    48:8F:5A:22:11:01 pppoe-25m     172.16.1.1     172.16.1.101",
      " 1   pppoe_user02   pppoe    48:8F:5A:22:11:02 pppoe-50m     172.16.1.1     172.16.1.102",
      " 2   fiber_gold_8   pppoe                      pppoe-100m    172.16.1.1     172.16.1.103"
    ].join("\n");
  }

  if (lower.startsWith("ppp active") || lower === "ppp active print") {
    return [
      "Flags: R - radius",
      " #   NAME           SERVICE  CALLER-ID         ADDRESS      UPTIME   ENCODING",
      " 0   pppoe_user01   pppoe    48:8F:5A:22:11:01 172.16.1.101 4d12h    cbc(128)",
      " 1   pppoe_user02   pppoe    48:8F:5A:22:11:02 172.16.1.102 1d03h    cbc(128)"
    ].join("\n");
  }

  if (lower.startsWith("queue simple") || lower === "queue simple print") {
    return [
      "Flags: X - disabled, I - invalid, D - dynamic",
      " #    NAME           TARGET         MAX-LIMIT    BURST-LIMIT",
      " 0    hs-user_88201  10.10.10.45/32 10M/25M      0/0",
      " 1    hs-card_vip_94 10.10.10.82/32 20M/50M      0/0",
      " 2    total-hotspot  10.10.10.0/24  80M/300M     0/0"
    ].join("\n");
  }

  if (lower.startsWith("user") || lower === "user print") {
    return [
      "Flags: X - disabled",
      " #   NAME     GROUP     ADDRESS",
      " 0   admin    full      0.0.0.0/0",
      " 1   noc-eng  read      192.168.88.0/24"
    ].join("\n");
  }

  if (lower.startsWith("certificate") || lower === "certificate print") {
    return [
      "Flags: K - decrypted-private-key, Q - private-key, R - rsa, T - trusted",
      " #     NAME             COMMON-NAME      EXPIRES-AFTER",
      " 0  K  ssl-cert         router.tawaswl   365d"
    ].join("\n");
  }

  if (lower.startsWith("log") || lower === "log print") {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    return [
      `${timeStr} system,info router rebooted`,
      `${timeStr} interface,info link up ether1-WAN`,
      `${timeStr} hotspot,info user 'user_88201' logged in from 10.10.10.45`,
      `${timeStr} dhcp,info assigned 192.168.88.100 to 74:D4:35:88:12:44`,
      `${timeStr} pppoe,info <pppoe_user01>: authenticated`
    ].join("\n");
  }

  if (lower.startsWith("ping") || lower.startsWith("tool ping")) {
    const target = clean.split(" ")[1] || "8.8.8.8";
    return [
      `  SEQ HOST                                     SIZE TTL TIME  STATUS`,
      `    0 ${target.padEnd(42, " ")} 56 117 14ms`,
      `    1 ${target.padEnd(42, " ")} 56 117 13ms`,
      `    2 ${target.padEnd(42, " ")} 56 117 15ms`,
      `    3 ${target.padEnd(42, " ")} 56 117 14ms`,
      `    sent=4 received=4 packet-loss=0% min-rtt=13ms avg-rtt=14ms max-rtt=15ms`
    ].join("\n");
  }

  if (lower.startsWith("system reboot") || lower === "reboot") {
    return "Rebooting system... Connection will be restored shortly.";
  }

  if (lower === "export" || lower === "/export") {
    return [
      "# 2026-09-25 14:52:10 by RouterOS 7.14.3",
      "# software id = HEE0-89F5",
      "#",
      "# model = CCR2004-16G-2S+",
      "/interface bridge add name=bridge-local",
      "/interface bridge add name=bridge1-Hotspot",
      "/ip pool add name=dhcp-pool-lan ranges=192.168.88.100-192.168.88.254",
      "/ip pool add name=hotspot-pool ranges=10.10.10.10-10.10.10.250",
      "/ip dhcp-server add address-pool=dhcp-pool-lan interface=bridge-local name=dhcp-lan",
      "/ip address add address=192.168.88.1/24 interface=bridge-local network=192.168.88.0",
      "/ip address add address=10.10.10.1/24 interface=bridge1-Hotspot network=10.10.10.0",
      "/ip firewall nat add action=masquerade chain=srcnat out-interface-list=WAN"
    ].join("\n");
  }

  if (lower === "help" || lower === "?" || lower === "/help") {
    return [
      "MikroTik RouterOS CLI Terminal - Common Commands Guide:",
      "-------------------------------------------------------",
      "  /interface print                  - List all network interfaces & status",
      "  /interface ethernet print         - List Ethernet ports and link speeds",
      "  /ip address print                 - Display IP addresses and assigned subnets",
      "  /ip route print                   - View routing table & gateways",
      "  /ip pool print                    - View IP address pools",
      "  /ip dns print                     - View DNS servers and cache configuration",
      "  /ip arp print                     - Display ARP cache entries",
      "  /ip neighbor print                - Discover neighboring CDP/MNDP devices",
      "  /ip dhcp-server lease print       - List active DHCP leases",
      "  /ip firewall filter print         - Show firewall security rules",
      "  /ip firewall nat print            - Show NAT & Masquerade rules",
      "  /ip hotspot user print            - List hotspot users & vouchers",
      "  /ip hotspot active print          - List currently active hotspot sessions",
      "  /ppp secret print                 - List PPPoE user accounts",
      "  /ppp active print                 - List connected PPPoE sessions",
      "  /queue simple print               - Display bandwidth rate-limit queues",
      "  /system resource print            - Display CPU, memory, uptime, architecture",
      "  /system routerboard print         - Show RouterBOARD hardware & firmware info",
      "  /system identity print            - Show router system hostname",
      "  /system clock print               - Show system time & timezone",
      "  /system package print             - Show installed RouterOS packages",
      "  /system health print              - Show voltage & board temperatures",
      "  /log print                        - View live system event logs",
      "  /ping <ip>                        - Send ICMP echo requests to target host",
      "  /export                           - Export active configuration script",
      "  clear                             - Clear terminal console screen"
    ].join("\n");
  }

  // Generic fallback for unrecognized command
  return `syntax error (line 1 column 1)\nbad command name '${clean}'. Type 'help' or '?' for available commands.`;
}

app.post("/api/mikrotik/cli", async (req, res) => {
  const { host, port, user, pass, ssl, command, isLiveApi } = req.body;
  if (!command) {
    return res.status(400).json({ success: false, message: "Command is required" });
  }

  const cleanCmd = command.trim();
  const normalized = cleanCmd.startsWith("/") ? cleanCmd.slice(1).toLowerCase().trim() : cleanCmd.toLowerCase().trim();

  let apiPath = "/rest/system/resource";
  let method = "GET";
  let bodyData: any = undefined;

  // Smart mapping from RouterOS CLI syntax to REST API path (with or without leading slash)
  if (normalized.startsWith("ip hotspot user")) {
    apiPath = "/rest/ip/hotspot/user";
  } else if (normalized.startsWith("ip hotspot active")) {
    apiPath = "/rest/ip/hotspot/active";
  } else if (normalized.startsWith("ip hotspot host")) {
    apiPath = "/rest/ip/hotspot/host";
  } else if (normalized.startsWith("ip hotspot profile") || normalized.startsWith("ip hotspot user profile")) {
    apiPath = "/rest/ip/hotspot/user/profile";
  } else if (normalized.startsWith("ip neighbor")) {
    apiPath = "/rest/ip/neighbor";
  } else if (normalized.startsWith("ip address")) {
    apiPath = "/rest/ip/address";
  } else if (normalized.startsWith("ip route")) {
    apiPath = "/rest/ip/route";
  } else if (normalized.startsWith("ip pool")) {
    apiPath = "/rest/ip/pool";
  } else if (normalized.startsWith("ip dns")) {
    apiPath = "/rest/ip/dns";
  } else if (normalized.startsWith("ip arp")) {
    apiPath = "/rest/ip/arp";
  } else if (normalized.startsWith("ip service")) {
    apiPath = "/rest/ip/service";
  } else if (normalized.startsWith("ip dhcp-server lease")) {
    apiPath = "/rest/ip/dhcp-server/lease";
  } else if (normalized.startsWith("ip dhcp-server")) {
    apiPath = "/rest/ip/dhcp-server";
  } else if (normalized.startsWith("ip dhcp-client")) {
    apiPath = "/rest/ip/dhcp-client";
  } else if (normalized.startsWith("ip firewall filter")) {
    apiPath = "/rest/ip/firewall/filter";
  } else if (normalized.startsWith("ip firewall nat")) {
    apiPath = "/rest/ip/firewall/nat";
  } else if (normalized.startsWith("ip firewall mangle")) {
    apiPath = "/rest/ip/firewall/mangle";
  } else if (normalized.startsWith("ip firewall address-list")) {
    apiPath = "/rest/ip/firewall/address-list";
  } else if (normalized.startsWith("ppp secret") || normalized.startsWith("interface pppoe-server")) {
    apiPath = "/rest/ppp/secret";
  } else if (normalized.startsWith("ppp active")) {
    apiPath = "/rest/ppp/active";
  } else if (normalized.startsWith("ppp profile")) {
    apiPath = "/rest/ppp/profile";
  } else if (normalized.startsWith("interface ethernet")) {
    apiPath = "/rest/interface/ethernet";
  } else if (normalized.startsWith("interface bridge port")) {
    apiPath = "/rest/interface/bridge/port";
  } else if (normalized.startsWith("interface bridge")) {
    apiPath = "/rest/interface/bridge";
  } else if (normalized.startsWith("interface wireless")) {
    apiPath = "/rest/interface/wireless";
  } else if (normalized.startsWith("interface vlan")) {
    apiPath = "/rest/interface/vlan";
  } else if (normalized.startsWith("interface wireguard")) {
    apiPath = "/rest/interface/wireguard";
  } else if (normalized.startsWith("interface")) {
    apiPath = "/rest/interface";
  } else if (normalized.startsWith("queue simple")) {
    apiPath = "/rest/queue/simple";
  } else if (normalized.startsWith("queue tree")) {
    apiPath = "/rest/queue/tree";
  } else if (normalized.startsWith("user active")) {
    apiPath = "/rest/user/active";
  } else if (normalized.startsWith("user")) {
    apiPath = "/rest/user";
  } else if (normalized.startsWith("certificate")) {
    apiPath = "/rest/certificate";
  } else if (normalized.startsWith("log")) {
    apiPath = "/rest/log";
  } else if (normalized.startsWith("system resource")) {
    apiPath = "/rest/system/resource";
  } else if (normalized.startsWith("system routerboard")) {
    apiPath = "/rest/system/routerboard";
  } else if (normalized.startsWith("system identity")) {
    apiPath = "/rest/system/identity";
  } else if (normalized.startsWith("system clock")) {
    apiPath = "/rest/system/clock";
  } else if (normalized.startsWith("system package")) {
    apiPath = "/rest/system/package";
  } else if (normalized.startsWith("system health")) {
    apiPath = "/rest/system/health";
  } else if (normalized.startsWith("system reboot") || normalized === "reboot") {
    apiPath = "/rest/system/reboot";
    method = "POST";
  } else if (normalized.startsWith("ping") || normalized.startsWith("tool ping")) {
    apiPath = "/rest/ping";
    method = "POST";
    const parts = cleanCmd.split(" ");
    bodyData = { address: parts[1] || "8.8.8.8", count: 4 };
  } else if (cleanCmd.startsWith("/rest/")) {
    apiPath = cleanCmd;
  } else {
    // If not a standard REST path, attempt direct path or fallback
    apiPath = `/rest/${normalized.replace(/\s+/g, "/")}`;
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
      timeoutMs: isLiveApi ? 5000 : 1200,
    });

    if (result.status >= 200 && result.status < 300) {
      return res.json({
        success: true,
        live: true,
        path: apiPath,
        statusCode: result.status,
        data: result.data,
      });
    }

    // If router responded with error or not found, fallback to simulated output engine
    return res.json({
      success: true,
      live: false,
      simulated: true,
      raw: generateSimulatedRouterOutput(cleanCmd)
    });
  } catch (err: any) {
    // Router offline or unreachable: smart simulated RouterOS CLI output engine
    return res.json({
      success: true,
      live: false,
      simulated: true,
      path: apiPath,
      raw: generateSimulatedRouterOutput(cleanCmd)
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
