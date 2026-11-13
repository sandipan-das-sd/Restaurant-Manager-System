# Restaurant Manager System

A small demo of sign-in and role access for one restaurant desk. Web and mobile use the same screens: **Welcome to Restaurant Manager System**, the signed-in role, and the desks that role may open.

This is not the full restaurant system. The desks stop at the door. Billing, stock, and real reports are not in this build.

## What to show

1. Open http://localhost:5173
2. Sign in as **Super Admin**. Every desk says Open.
3. Tap **Kitchen**. The server says it is open for Super Admin.
4. Sign out, then sign in as **Cashier**.
5. The welcome line stays. The role is now Cashier. Only **Sales desk** is open. Kitchen, Purchases, Reports, and Roles are closed.
6. Tap a closed desk. The server refuses it.
7. The phone app does the same thing.

## Run it on this computer

Docker Desktop needs to be running. MySQL is published on port 3307 so it does not clash with a MySQL already installed here. Redis stays on 6379.

```bash
docker compose up -d
npm install
npm run dev
```

Web: http://localhost:5173

API: http://localhost:4000

Phone, on the same Wi-Fi:

```bash
npm run dev:mobile
```

Open the project in Expo Go. The app calls this computer on port 4000.

Every demo account uses the password `Dhabar@123`.

| Role | Email | Desks that open |
| --- | --- | --- |
| Super Admin | superadmin@dhabar.local | All |
| Owner | owner@dhabar.local | All |
| Manager | manager@dhabar.local | Sales, Kitchen, Purchases, Reports |
| Cashier | cashier@dhabar.local | Sales desk |
| Kitchen staff | kitchen@dhabar.local | Kitchen |
| Purchase staff | purchase@dhabar.local | Purchases |
| Viewer | viewer@dhabar.local | Reports |

The login screen can open each role in one tap.

## Folder map

Web and mobile use the same shape.

```text
apps/server/src
  config/                   environment
  db/                       MySQL, Redis, ids
  http/                     errors and request ids
  features/auth             sign-in
  features/access           roles and seed data
  features/dashboard        welcome and desks
  tests/                    sign-in and role checks
apps/web/src
  config/                   API client
  components/               header, role badge, desk cards
  features/auth             sign-in
  features/dashboard        welcome and role desks
apps/mobile/src
  config/                   API client, session, colors
  components/               header, role badge, desk cards
  features/auth             sign-in
  features/dashboard        welcome and role desks
apps/server/src/shared      roles, desks, demo accounts
```

One repository. A push runs the same pipeline for the API, the website, and the phone app.

## Addresses

| What | Address |
| --- | --- |
| API | https://test.sandipandas.website |
| Website | https://resturent.sandipandas.website |

A production website build calls the API address above. The installable Android app does too. On this computer, `npm run dev` still uses localhost.

## Host it on the VPS

Do these once. After that, a push to `main` updates the server by itself.

1. At your DNS host, point both names at the VPS IP address.
   - `test.sandipandas.website`
   - `resturent.sandipandas.website`
2. On the VPS, install Docker, Nginx, and Certbot. Open ports 22, 80, and 443.
3. Push this repository to GitHub if it is not there yet. On the VPS:

```bash
sudo mkdir -p /opt/restaurant-manager
sudo chown "$USER" /opt/restaurant-manager
git clone https://github.com/sandipan-das-sd/Restaurant-Manager-System.git /opt/restaurant-manager
cd /opt/restaurant-manager
openssl rand -base64 48
```

4. Create `/opt/restaurant-manager/.env` on the server. Do not commit this file. Put the random string from the command above into `JWT_ACCESS_SECRET`.

```bash
PORT=4000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=dhabar
MYSQL_PASSWORD=dhabar
MYSQL_DATABASE=dhabar
REDIS_URL=redis://127.0.0.1:6379
JWT_ACCESS_SECRET=paste-the-random-string-here
CORS_ORIGIN=https://resturent.sandipandas.website
```

5. Start the API, MySQL, Redis, and the website container:

```bash
docker compose --profile host up -d --build
```

6. Copy the two Nginx site files and ask Certbot for HTTPS:

```bash
sudo cp deploy/nginx/test.sandipandas.website.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/resturent.sandipandas.website.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/test.sandipandas.website.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/resturent.sandipandas.website.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d test.sandipandas.website -d resturent.sandipandas.website
```

7. In the GitHub repository, open Settings, then Secrets and variables, then Actions. Add:
   - `VPS_HOST` — the server IP
   - `VPS_USER` — the Linux user that owns `/opt/restaurant-manager`
   - `VPS_SSH_KEY` — the private key that matches a public key in that user's `~/.ssh/authorized_keys`
   - `VPS_PORT` — only if SSH is not on port 22

The next push to `main` runs the tests, then connects to the VPS and runs `deploy/vps-update.sh`. That pulls the new code and rebuilds the API and the website. Until those secrets exist, the deploy step is skipped and the tests still run.

MySQL and Redis stay on the VPS only. They are not open to the internet.

## Android app and over-the-air updates

The client installs one APK. Later JavaScript changes go out with `npm run ota`. The phone downloads that update the next time the app opens. A new APK is only needed when the app version in `apps/mobile/app.json` changes, or when a new native module is added.

1. Create a free account at https://expo.dev and install nothing extra. From this computer:

```bash
npx eas-cli login
npx eas-cli init
```

Run the second command inside `apps/mobile` if it does not detect the project. It writes the Expo project id into `apps/mobile/app.json`. Commit that id.

2. Build the APK. Expo's cloud builds it. When the page shows a download link, send that file to the client.

```bash
npm run apk
```

3. After you change the screens or the shared role list, publish an update to phones that already have that APK:

```bash
npm run ota
```

Leave `"version": "0.1.0"` as it is while you use this APK. Over-the-air updates only install on a build with the same version.

## Checks

```bash
npm test
npm run build
```
