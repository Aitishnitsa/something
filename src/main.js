import axios from "axios";

window.addEventListener('DOMContentLoaded', () => {
    const split = new SplitType(".main-title");

    if (window.innerWidth > 768) {
        gsap.set(".flair", {xPercent: -50, yPercent: -50});

        let xTo = gsap.quickTo(".flair", "x", {duration: 0.6, ease: "power3"}),
            yTo = gsap.quickTo(".flair", "y", {duration: 0.6, ease: "power3"});

        window.addEventListener("mousemove", e => {
            xTo(e.clientX);
            yTo(e.clientY);
        });
    }

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
        .to(".ava", {
            duration: 1,
            bottom: 0,
            ease: "power4.out",
        })
        .to("section", {
            duration: 3,
            ease: "elastic.out(1,0.3)",
            y: window.innerWidth < 768 ? -200 : -256
        }, "-=0.5")
});

document.addEventListener('mousemove', e => {
    const offsetX = (e.clientX / window.innerWidth - 0.5) * 40;
    const offsetY = (e.clientY / window.innerHeight - 0.5) * 40;
    gsap.to('.ava-eyes', { x: offsetX, y: offsetY, duration: 0.6, ease: 'power3.out' });
});


window.addEventListener('DOMContentLoaded', async () => {
    try {
        let ip = "";
        try {
            const ipRes = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
            ip = ipRes?.data?.ip ?? null;
        } catch (err) {
            console.warn('Failed to fetch IP:', err);
        }

        let geo = {};
        if (ip !== "") {
            try {
                const geoRes = await axios.get(`https://ipwho.is/${ip}`, { timeout: 5000 });
                geo = geoRes?.data ?? {};
            } catch (err) {
                console.warn('Failed to fetch geo:', err);
            }
        }

        const timing = (typeof performance !== 'undefined' && performance.timing) ? performance.timing : {};
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
