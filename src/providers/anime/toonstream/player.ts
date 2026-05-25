import { ScrapeMovieSources } from "./scrapers/movie";
import { ScrapeEpisodeSources } from "./scrapers/series";

// Global player data
let playerUrl: string | null = null;
let thumbnail: string | null = null;

let subtitle: {
  label: string;
  url: string;
} | null = null;

export async function moviePlayer(slug: string) {
  const res = await ScrapeMovieSources(slug);

  const sources = res?.sources || [];

  const proxy1 = sources[0]?.proxiedUrl || null;
  const proxy2 = sources[1]?.proxiedUrl || null;

  // keep your old fallback
  playerUrl = proxy2 || proxy1;

  // thumbnail logic
  thumbnail =
    sources[1]?.cover || // Ruby correct cover
    sources[1]?.thumbnail || // fallback
    sources[0]?.thumbnail || // Multi Audio
    null;

  // subtitle logic
  subtitle = sources[1]?.subtitles
    ? {
        label: sources[1].subtitles.label,
        url: sources[1].subtitles.url,
      }
    : null;

  if (!proxy1 && !proxy2) {
    return new Response("Movie source not found", { status: 404 });
  }

  return makeHtml("Movie", slug);
}

export async function episodePlayer(slug: string, req: Request) {
  const res = await ScrapeEpisodeSources(slug, req);

  const sources = res?.sources || [];

  const proxy1 = sources[0]?.proxiedUrl || null;
  const proxy2 = sources[1]?.proxiedUrl || null;

  // keep your old fallback
  playerUrl = proxy2 || proxy1;

  // thumbnail logic
  thumbnail =
    sources[1]?.cover || // Ruby correct cover
    sources[1]?.thumbnail || // fallback
    sources[0]?.thumbnail || // Multi Audio
    null;

  // subtitle logic
  subtitle = sources[1]?.subtitles
    ? {
        label: sources[1].subtitles.label,
        url: sources[1].subtitles.url,
      }
    : null;

  if (!proxy1 && !proxy2) {
    return new Response("Episode source not found", { status: 404 });
  }

  return makeHtml("Episode", slug);
}
function makeHtml(_type: string, _slug: string) {
  return new Response(
    `
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>COOREN PLAYER</title>
  <style>
    /* --- YOUR EXACT CSS INTEGRATION --- */
    body { 
      padding: 0; margin: 0; font-family: Arial, Helvetica, sans-serif; 
      font-size: 16px; line-height: 1.6em; color: #fff; height: 100vh; 
      position: relative; background: rgb(0,0,0); 
      background: linear-gradient(180deg, rgba(0,0,0,1) 60%, rgba(23,23,23,1) 100%); 
      overflow: hidden;
    }
    
    #player { width: 100% !important; height: 100% !important; position: absolute; z-index: 4; top: 0; left: 0; }

    /* --- PROGRESS BAR & CHAPTERS (FROM YOUR CSS) --- */
    .jw-slider-horizontal.jw-chapter-slider-time .jw-slider-container .jw-timesegment-background{ background-color: rgba(255,255,255,.2) !important;}
    .jw-slider-horizontal.jw-chapter-slider-time .jw-slider-container .jw-timesegment-buffered{ background-color: rgba(255,255,255,.1) !important;}
    .jw-slider-horizontal.jw-chapter-slider-time .jw-slider-container .jw-timesegment-progress{ background-color: #008da7 !important;}
  
    
    .jw-icon-rewind {
  display: none !important;
}
.jw-icon.jw-icon-display.jw-button-color.jw-reset{
  color: white !important;
margin-left: 3.5rem !important;
}
  </style>
  /* if its not work try host this js file separately and link into these src*/
  <script src="jwplayer.js"></script>
</head>

<body>
  <div id="player"></div>
  <script>
    const source1 = "${playerUrl}";
const thumbnail = "${thumbnail}";
const sub1 = "${subtitle?.url || ""}";

    const player = jwplayer("player").setup({
      sources: [
        {
          file: source1,
          type: "hls"
        },
      ],
      image: thumbnail,
      width: "100%",
      height: "100%",
      stretching: "uniform",
       duration: "1420",

       tracks: sub1 ? [
{
 file: sub1,
 label: "English",
 kind: "captions",
 default: true,
}
] : [],

      captions: {
        color: "#FFFFFF",
        fontSize: 16,
        backgroundOpacity: 0,
        fontFamily: "Tahoma",
      },

      playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3],

    });
    player.on("ready", function () {
      player.addButton(
        \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 980 826" class="jw-svg-icon" style="width: 50% !important; height: 50% !important; margin: auto !important; display: block !important; fill: white; pointer-events: none;">
                <g transform="translate(0, 826) scale(0.1, -0.1)">
                    <path d="M4620 8243 c-543 -39 -1058 -177 -1536 -411 -208 -103 -295 -153 -484 -278 -628 -416 -1131 -994 -1461 -1679 -241 -501 -375 -1021 -409 -1584 -5 -90 -11 -165 -12 -166 -2 -2 -37 -17 -80 -34 -267 -111 -475 -331 -573 -605 -66 -184 -65 -160 -65 -1402 0 -1206 0 -1206 52 -1364 97 -296 319 -537 591 -642 158 -62 152 -61 674 -65 l482 -4 4 2128 c3 1557 7 2153 16 2223 69 552 225 987 507 1417 107 162 218 298 373 457 265 270 551 477 876 631 367 175 728 268 1150 296 534 35 1124 -92 1595 -343 817 -437 1389 -1182 1594 -2076 40 -172 65 -374 76 -598 5 -120 10 -1047 10 -2172 l0 -1963 483 3 482 4 90 27 c358 105 615 378 717 758 l22 84 4 1155 c3 1037 1 1165 -14 1255 -41 249 -168 476 -352 632 -87 72 -156 114 -269 163 l-88 38 -2 73 c-38 1209 -621 2371 -1573 3133 -660 529 -1437 837 -2283 906 -116 9 -486 11 -597 3z" />
                    <path d="M2383 4071 c-94 -35 -166 -102 -210 -196 l-28 -60 0 -1765 0 -1765 33 -67 c64 -131 178 -201 327 -202 67 0 90 4 143 28 80 37 162 122 191 201 l21 56 -2 1762 -3 1762 -26 56 c-37 79 -90 133 -166 171 -85 41 -199 49 -280 19z" />
                    <path d="M7191 4076 c-111 -37 -218 -151 -241 -259 -8 -38 -10 -531 -8 -1797 l3 -1745 32 -60 c76 -146 233 -225 385 -195 117 23 206 89 261 195 l32 60 0 1775 0 1775 -29 59 c-62 127 -170 198 -311 203 -50 2 -96 -3 -124 -11z" />
                </g>
            </svg>\`,
        "Audio Settings",
        function () {
          const settingsBtn = document.querySelector(
            "#player .jw-controls .jw-icon-settings",
          );

          if (settingsBtn) {
            settingsBtn.click();
            setTimeout(function () {
              const audioSettingBtn = document.querySelector(
                ".jw-settings-audioTracks",
              );

              if (audioSettingBtn) {
                audioSettingBtn.click();
              } else {
                console.log("audioSettingBtn not found", audioSettingBtn);
              }
            }, 0); // allow DOM update
          } else {
            console.log("settingsBtn not found", settingsBtn);
          }
        },
        "custom-audio-btn",
      );
    });
  </script>
</body>

</html>
`,
    {
      headers: { "content-type": "text/html" },
    },
  );
}
