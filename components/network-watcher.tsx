"use client";
import { useEffect } from "react";
import { Network } from "@capacitor/network";
import {PluginListenerHandle} from "@capacitor/core";

export default function NetworkWatcher() {
    useEffect(() => {
        // Check if device is Android
        const isAndroid = navigator.userAgent.toLowerCase().includes("android");

        if (!isAndroid) return; // exit early if not Android

        let listener: PluginListenerHandle;

        const checkNetwork = async () => {
            const status = await Network.getStatus();

            if (!status.connected && window.location.pathname !== "/offline.html") {
                window.location.href = "/offline.html";
            } else if (status.connected && window.location.pathname === "/offline.html") {
                window.location.href = "/";
            }
        };

        const setupListener = async () => {
            listener = await Network.addListener("networkStatusChange", (status) => {
                if (!status.connected && window.location.pathname !== "/offline.html") {
                    window.location.href = "/offline.html";
                } else if (status.connected && window.location.pathname === "/offline.html") {
                    window.location.href = "/";
                }
            });
        };

        setupListener().catch(console.error);
        checkNetwork().catch(console.error);

        return () => {
            listener?.remove();
        };
    }, []);

    return null;
}
