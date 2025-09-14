// api/create-panel.js
import { pterodactylConfig } from '../config.js';

function getServerResources(ramSelection) {
    const resources = { ram: 0, disk: 0, cpu: 0 };
    switch (ramSelection) {
        case "1gb": resources.ram = 1024; resources.disk = 3072; resources.cpu = 40; break;
        case "2gb": resources.ram = 2048; resources.disk = 5120; resources.cpu = 60; break;
        case "3gb": resources.ram = 3072; resources.disk = 7168; resources.cpu = 80; break;
        case "4gb": resources.ram = 4096; resources.disk = 8192; resources.cpu = 100; break;
        case "5gb": resources.ram = 5120; resources.disk = 10240; resources.cpu = 120; break;
        case "6gb": resources.ram = 6144; resources.disk = 11264; resources.cpu = 140; break;
        case "7gb": resources.ram = 7168; resources.disk = 12288; resources.cpu = 160; break;
        case "8gb": resources.ram = 8192; resources.disk = 13312; resources.cpu = 180; break;
        case "9gb": resources.ram = 9216; resources.disk = 14336; resources.cpu = 200; break;
        case "10gb": resources.ram = 10240; resources.disk = 15360; resources.cpu = 220; break;
        case "unlimited": resources.ram = 0; resources.disk = 0; resources.cpu = 0; break;
        default: throw new Error("Pilihan RAM tidak valid.");
    }
    return resources;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const { domain, apiKey, eggId, locationId } = pterodactylConfig;
    const { username, password, serverName, ram } = req.body;
    if (!username || !password || !ram) {
        return res.status(400).json({ message: 'Username Pterodactyl, password, dan RAM wajib diisi.' });
    }
    try {
        const finalServerName = serverName || username;
        const userResponse = await fetch(`${domain}/api/application/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json',
            },
            body: JSON.stringify({
                email: `${username}@${domain.replace(/^https?:\/\//, '')}`,
                username: username, first_name: username, last_name: 'User', password: password,
            }),
        });
        const userData = await userResponse.json();
        if (!userResponse.ok) {
            if (userData.errors && userData.errors[0].code === 'UnprocessableEntityHttpException') {
                throw new Error(`Username atau email panel Pterodactyl sudah terdaftar.`);
            }
            throw new Error(userData.errors ? userData.errors[0].detail : 'Gagal membuat user di Pterodactyl.');
        }
        const userId = userData.attributes.id;
        const { ram: memory, disk, cpu } = getServerResources(ram);
        const serverResponse = await fetch(`${domain}/api/application/servers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Accept': 'application/json',
            },
            body: JSON.stringify({
                name: finalServerName, user: userId, egg: parseInt(eggId),
                docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
                startup: "if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/npm start",
                environment: { "SERVER_JARFILE": "server.jar", },
                limits: { memory: memory, swap: 0, disk: disk, io: 500, cpu: cpu, },
                feature_limits: { databases: 5, allocations: 1, backups: 5, },
                deploy: { locations: [parseInt(locationId)], dedicated_ip: false, port_range: [], },
            }),
        });
        const serverData = await serverResponse.json();
        if (!serverResponse.ok) {
            await fetch(`${domain}/api/application/users/${userId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            throw new Error(serverData.errors ? serverData.errors[0].detail : 'Gagal membuat server di Pterodactyl.');
        }
        res.status(200).json({
            message: 'Panel berhasil dibuat!', loginUrl: domain, username: username, password: password,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}