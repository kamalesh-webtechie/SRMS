import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const GlobalDateTime = () => {
    const [currentTime, setCurrentTime] = useState(null);
    const [config, setConfig] = useState({
        timezone: 'Asia/Kolkata',
        dateFormat: 'dd-MM-yyyy',
        timeFormat: '12H'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Store server-client offset
    const offsetRef = useRef(0);

    const fetchServerTime = async () => {
        try {
            const { data } = await api.get('/system/now'); // Ensure this matches route
            const serverTime = new Date(data.serverTime).getTime();
            const now = Date.now();
            offsetRef.current = serverTime - now;

            setConfig({
                timezone: data.timezone,
                dateFormat: data.dateFormat,
                timeFormat: data.timeFormat
            });

            setLoading(false);
            setError(false);
            updateTick(); // Immediate update
        } catch (err) {
            console.error("Failed to sync time:", err);
            setError(true);
            setLoading(false);
        }
    };

    const updateTick = () => {
        if (error) return;
        const now = Date.now();
        const adjustedTime = new Date(now + offsetRef.current);
        setCurrentTime(adjustedTime);
    };

    // Initial Fetch & Regular Sync (5 mins)
    useEffect(() => {
        fetchServerTime();
        const syncInterval = setInterval(fetchServerTime, 5 * 60 * 1000);
        return () => clearInterval(syncInterval);
    }, []);

    // Local Tick (1 sec)
    useEffect(() => {
        const tickInterval = setInterval(updateTick, 1000);
        return () => clearInterval(tickInterval);
    }, [error]);

    if (error || loading || !currentTime) {
        return (
            <div className="text-gray-400 text-sm font-mono flex items-center">
                <span className="animate-pulse">--:-- --</span>
            </div>
        );
    }

    // Formatting Logic
    const formatDateTime = (date, timezone, dateFormat, timeFormat) => {
        try {
            // Options for Intl.DateTimeFormat
            const options = {
                timeZone: timezone,
                weekday: 'short',
                day: '2-digit',
                month: 'short', // 31 Jan
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit', // Requirement said '05:22 PM' (no seconds?). User said '05:22 PM' in Example UI.
                // But generally clocks show seconds or just minutes. Example: Sat, 31 Jan 2026 | 05:22 PM
                hour12: timeFormat === '12H'
            };

            // Intl standard formatting
            const formatter = new Intl.DateTimeFormat('en-GB', options);
            const parts = formatter.formatToParts(date);

            /* 
               Parts example (en-GB):
               { type: "weekday", value: "Sat" }, { type: "literal", value: ", " },
               { type: "day", value: "31" }, { type: "literal", value: " " },
               { type: "month", value: "Jan" }, { type: "literal", value: " " },
               { type: "year", value: "2026" }, { type: "literal", value: ", " },
               { type: "hour", value: "11" }, ...
            */

            const getPart = (type) => parts.find(p => p.type === type)?.value;

            const day = getPart('day');
            const month = getPart('month');
            const year = getPart('year');
            const weekday = getPart('weekday'); // Sat
            const hour = getPart('hour');
            const minute = getPart('minute');
            const dayPeriod = getPart('dayPeriod') || (parseInt(hour) >= 12 ? 'PM' : 'AM'); // Fallback if 24h

            const timeStr = `${hour}:${minute} ${timeFormat === '12H' ? dayPeriod : ''}`;
            const dateStr = `${weekday}, ${day} ${month} ${year}`;

            return `${dateStr} | ${timeStr}`;

        } catch (e) {
            return date.toLocaleString();
        }
    };

    return (
        <div className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md shadow-sm border border-gray-200 hidden md:block">
            {formatDateTime(currentTime, config.timezone, config.dateFormat, config.timeFormat)}
        </div>
    );
};

export default GlobalDateTime;
