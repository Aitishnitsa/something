import './style.css'
import axios from "axios";

window.addEventListener('DOMContentLoaded', () => {
    const split = new SplitType(".main-title");

    gsap.timeline()
        .from(split.chars, {
            duration: 0.1,
            autoAlpha: 0,
            stagger: 0.07,
        })
        .to(".subtitle", {
            duration: 1,
            opacity: 1,
            y: 0,
            delay: 0.5,
            ease: "power3.out"
        })
        .from(".ava", {
            duration: 1,
            y: 2048,
            ease: "power4.out",
        })
        .to("section", {
            duration: 3,
            ease: "elastic.out(1,0.3)",
            y: window.innerWidth < 768 ? -200 : -256
        }, "-=0.5")
});

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const ipRes = await axios.get('https://api.ipify.org?format=json');
        const ip = ipRes.data?.ip;

        const geoRes = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
        const geo = geoRes.data ?? {};

        const timing = performance.timing;
        const payload = {
            ip,
            geo,
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString(),
            url: window.location.href,
            navigationStart: timing.navigationStart ? new Date(timing.navigationStart).toISOString() : null,
            domContentLoaded: timing.domContentLoadedEventEnd ? new Date(timing.domContentLoadedEventEnd).toISOString() : null,
            loadTime: timing.loadEventEnd ? new Date(timing.loadEventEnd).toISOString() : null,
        };

        const apiBase = import.meta.env.VITE_API_URL ?? '/';
        const response = await axios.post(apiBase, payload, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.status < 200 || response.status >= 300) {
            console.error('Error', response.status, response.data);
        } else {
            // hehe
        }
    } catch (err) {
        // error
    }
});
