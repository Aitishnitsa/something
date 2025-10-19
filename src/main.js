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

window.addEventListener('load', async () => {
    const timing = performance.timing;
    const data = {
        navigationStart: timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadTime: timing.loadEventEnd - timing.navigationStart,
        userAgent: navigator.userAgent,
        url: window.location.href
    };

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { 'Content-Type': 'application/json' }
    });

    try {
        const response = await api.post('/', data);
        if (response.status >= 200 && response.status < 300) {
            // console.log('Data sent successfully');
        } else {
            // console.error('Failed to send data');
        }
    } catch (error) {
        // console.error('Error sending data:', error);
    }
});