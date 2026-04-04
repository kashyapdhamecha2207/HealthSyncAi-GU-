self.addEventListener("install", (event) => {
  console.log("App Installed");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
