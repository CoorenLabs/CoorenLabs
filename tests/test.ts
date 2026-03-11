// async function fetchVideo() {
//     const url = "https://streamta.site/get_video?id=vx8e4b2ZLRS4mZb&expires=1773190204&ip=F0EUKRERKxSHDN&token=-FiHsvx8N_37&stream=1";


//     const options: RequestInit = {
//         method: "GET",
//         redirect: "manual",
//         headers: {
//             "Accept": "*/*",
//             "Accept-Encoding": "identity;q=1, *;q=0",
//             "Accept-Language": "en-US,en;q=0.5",
//             "Connection": "keep-alive",
//             "Cookie": "_ym_uid=1773119056405401869; _ym_d=1773119056; _ym_isad=2",
//             "origin": "https://streamta.site",
//             "Referer": "https://streamta.site/e/vx8e4b2ZLRS4mZb/Fight.Club.10th.Anniversary.Edition.1999.1080p.BrRip.x264.YIFY.mp4",
//             "sec-ch-ua": '"Not:A-Brand";v="99", "Brave";v="145", "Chromium";v="145"',
//             "sec-ch-ua-mobile": "?0",
//             "sec-ch-ua-platform": '"Windows"',
//             "Sec-Fetch-Dest": "video",
//             "Sec-Fetch-Mode": "cors",
//             "Sec-Fetch-Site": "same-origin",
//             "Sec-Fetch-Storage-Access": "none",
//             "Sec-GPC": "1",
//             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"
//         }
//     };

//     try {
//         console.log(`Sending GET request to ${new URL(url).hostname}...`);
//         const response = await fetch(url, options);

//         // Logging the core response details
//         console.log("\n=== Response Status ===");
//         console.log(`Status Code: ${response.status}`);
//         console.log(`Status Text: ${response.statusText}`);
//         console.log(`Response OK: ${response.ok}`);
//         console.log(`Redirected: ${response.redirected}`);
//         console.log(`res: ${await response.text()}`);

//         // Iterating and logging all response headers
//         console.log("\n=== Response Headers ===");
//         for (const [key, value] of response.headers.entries()) {
//             console.log(`${key}: ${value}`);
//         }

//         if (response.ok) {
//             console.log("\nRequest successful! (Since this looks like a video stream, you'd handle the response body as an ArrayBuffer, Blob, or ReadableStream next).");
//         }

//     } catch (error) {
//         console.error("\nFetch failed:", error);
//     }
// }

// // Execute the function
// fetchVideo();

// extractStreamtape("https://streamta.site/e/0ZqD3GkxGxUbPpV/")
// extractStreamtape("https://streamta.site/e/XqG4KlpxPjHD8WO/War.Machine.2026.1080p.NF.WEB-DL.DDP5.1.Atmos.H.264-BYNDR.mp4")
// extractStreamtape("https://streamta.site/e/XJPA3KYAy7uDVJk/")
// extractStreamtape("https://streamta.site/e/gq3zd7ZBpaIqyg9/Rooster.S01E01.Release.the.Brown.Fat.1080p.AMZN.WEB-DL.DDP5.1.Atmos.H.264-RAWR.mp4")
// extractStreamtape("https://streamta.site/e/8J28dLJKKqiozQX/Cold.Storage.2026.1080p.AMZN.WEB-DL.DDP5.1.H.264-KyoGo.mp4")



fetch("https://primesrc.me/api/v1/s?tmdb=550&type=movie", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,hi;q=0.8,bn;q=0.7",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"143\", \"Chromium\";v=\"143\", \"Not A(Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    // "cookie": "cf_clearance=oyed4X9iXmtDQ.kzjFtfZd07rD8NyN4fSQlsmOdkSe4-1773210248-1.2.1.1-_hkIXrlHCmHUW.aoRYnTphA63Xf9pJPflrKRkkIoczBao7yZQgdnfpzQZXVQfVKjyA3TfP_jf0K5X4o5K8s43vwlre5uVcRpdEHQHZDtHFAa8gH95gzCqvUIElXPvT65bRh4plDFlR2oxh9H8Uq1oI.K0jyoXLyqpK4f8SH05s7bM_fgQpIlBbYGZdDdNif9.adD8KbDpflut1dPlRvfb8GtU_F1udkuFkBEph4wY8U",
    "Referer": "https://primesrc.me/embed/movie?tmdb=550"
  },
  "body": null,
  "method": "GET"
}).then(async res => console.log(await res.text()))