import React, { useState, useEffect, useRef } from "react";

const symbols = "!@#$%^&*()_+{}:\"<>?|[];',./`~\\";
const lower = "abcdefghijklmnopqrstuvwxyz";
const upper = lower.toUpperCase();
const numbers = "0123456789";

const localWords = [
  "avocado", "bamboo", "cascade", "delight", "echo",
  "flamingo", "gazelle", "harmony", "ivory", "jubilee",
  "koala", "lagoon", "mango", "nirvana", "octopus",
  "penguin", "quasar", "rainbow", "sunset", "tundra",
  "umbra", "vortex", "waterfall", "xylophone", "yellow",
  "zebra", "alpine", "blossom", "coral", "dolphin",
  "evergreen", "firefly", "glacier", "honeydew", "island",
  "jungle", "kiwi", "lighthouse", "mountain", "nebula",
  "oasis", "peacock", "quartz", "river", "starlight",
  "tropical", "unicorn", "volcano", "whirlpool", "xenon"
].filter(word => word.length >= 4);

type WordCase = "lower" | "upper" | "random";

function randomizeCase(word: string) {
  return word
    .split("")
    .map(c => (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()))
    .join("");
}

function applyWordCase(word: string, caseType: WordCase) {
  if (caseType === "lower") return word.toLowerCase();
  if (caseType === "upper") return word.toUpperCase();
  if (caseType === "random") return randomizeCase(word);
  return word;
}

let apiIndex = 0; // tracks next api

const WORD_APIS = [
  {
    name: "RandomWordAPI",
    url: (len: number) => `https://random-word-api.herokuapp.com/word?number=1&length=${len}`,
    parser: (data: any) => data[0]
  },
  {
    name: "Datamuse",
    url: (len: number) => `https://api.datamuse.com/words?sp=${'?'.repeat(len)}&max=10`,
    parser: (data: any) => data[Math.floor(Math.random() * data.length)]?.word
  },
  {
    name: "Wordnik",
    url: (len: number) =>
      `https://api.wordnik.com/v4/words.json/randomWords?limit=1&minLength=${len}&maxLength=${len}&api_key=YOUR_API_KEY`,
    parser: (data: any) => data[0]?.word
  },
  {
    name: "WiktionaryBackups",
    url: (len: number) => `https://random-word-form.herokuapp.com/random/noun?length=${len}`,
    parser: (data: any) => data[0]
  }
];

async function fetchWithTimeout(url: string, timeout = 2000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function fetchRandomWord(maxLength: number): Promise<string> {
  const attempts = WORD_APIS.length;

  for (let i = 0; i < attempts; i++) {
    const api = WORD_APIS[apiIndex % WORD_APIS.length];
    apiIndex++;

    try {
      const response = await fetchWithTimeout(api.url(maxLength));
      if (!response.ok) continue;

      const data = await response.json();
      const word = api.parser(data);

      if (word && word.length <= maxLength) return word;
    } catch (error) {
      console.debug(`API ${api.name} failed, trying next`);
    }
  }

  const validWords = localWords.filter(word => word.length <= maxLength);
  return validWords[Math.floor(Math.random() * validWords.length)] ||
    generateFallbackWord(maxLength);
}

function generateFallbackWord(length: number): string {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  let word = "";

  for (let i = 0; i < length; i++) {
    word += i % 2 === 0
      ? consonants.charAt(Math.floor(Math.random() * consonants.length))
      : vowels.charAt(Math.floor(Math.random() * vowels.length));
  }

  return word;
}

function generateRandomChars(length: number, charSet: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return result;
}

async function generatePassword(
  length: number,
  options: { lower: boolean; upper: boolean; numbers: boolean; symbols: boolean; word: boolean },
  wordCase: WordCase
): Promise<string> {
  let charSet = "";
  if (options.lower) charSet += lower;
  if (options.upper) charSet += upper;
  if (options.numbers) charSet += numbers;
  if (options.symbols) charSet += symbols;

  if (!charSet && !options.word) return "";

  if (options.word && !charSet) {
    const word = await fetchRandomWord(length);
    return applyWordCase(word, wordCase).slice(0, length);
  }

  if (options.word) {
    const word = await fetchRandomWord(Math.min(length, 8));
    const caseAdjustedWord = applyWordCase(word, wordCase);
    const remainingLength = length - caseAdjustedWord.length;

    if (remainingLength <= 0) {
      return caseAdjustedWord.slice(0, length);
    }

    const randomChars = generateRandomChars(remainingLength, charSet);
    const insertPos = Math.floor(Math.random() * (randomChars.length + 1));
    return randomChars.slice(0, insertPos) + caseAdjustedWord + randomChars.slice(insertPos);
  }

  return generateRandomChars(length, charSet);
}

function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops = new Array(columns).fill(1);

    const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポqwertQWERTYUIOPASDFGHJKLZXCVBNMyuiopasdfghjkll;zxcvbnm,.[0123456789@#$%^&*()";

    function draw() {
      if (!ctx) return;
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#0F0";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
      }}
    />
  );
}

const SocialLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "#0f0",
      textDecoration: "none",
      margin: "0 0.5rem",
      fontSize: "0.8rem",
      transition: "all 0.3s ease",
      opacity: 0.7,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
      (e.currentTarget as HTMLAnchorElement).style.textShadow = "0 0 5px #0f0";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7";
      (e.currentTarget as HTMLAnchorElement).style.textShadow = "none";
    }}
  >
    {children}
  </a>
);

export default function App() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    lower: true,
    upper: true,
    numbers: true,
    symbols: true,
    word: false
  });
  const [wordCase, setWordCase] = useState<WordCase>("lower");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout>();

  const handleGenerate = async () => {
    setLoading(true);
    const pwd = await generatePassword(length, options, wordCase);
    setPassword(pwd);
    setLoading(false);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);

    if (outputRef.current) {
      outputRef.current.focus();
    }
  };

  const inputLabelStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "0.5rem",
    cursor: "pointer",
    userSelect: "none",
    gap: "0.5rem",
    fontSize: "1rem",
  };

  const checkboxStyle = {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#0f0",
    filter: "drop-shadow(0 0 3px #0f0)",
  };

  const radioStyle = {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#0f0",
    filter: "drop-shadow(0 0 3px #0f0)",
  };

  return (
    <>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Rubik+Mono+One&display=swap" rel="stylesheet" />
      </head>
      <MatrixBackground />
      <main
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 600,
          margin: "4rem auto",
          padding: "1rem 2rem 3rem",
          borderRadius: 10,
          backgroundColor: "rgba(0,0,0,0.75)",
          color: "#0f0",
          fontFamily: "monospace",
          boxShadow: "0 0 15px #0f0",
          userSelect: "none",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: "2.5rem",
            color: "#0f0",
            textShadow: "0 0 10px #0f0, 0 0 20px #0f0",
            letterSpacing: "0.1em",
            animation: "glow 2s ease-in-out infinite alternate",
          }}
        >
          🔐 PASS GEN
        </h1>
        <style>
          {`
            @keyframes glow {
              from {
                text-shadow: 0 0 5px #0f0, 0 0 10px #0f0;
              }
              to {
                text-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0;
              }
            }
          `}
        </style>

        <label htmlFor="length" style={{ display: "block", marginBottom: "1rem" }}>
          Length: {length}
          <input
            id="length"
            type="range"
            min={4}
            max={32}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ 
              width: "100%", 
              marginTop: "0.25rem",
              WebkitAppearance: "none",
              height: "8px",
              background: "rgba(15, 15, 15, 0.8)",
              borderRadius: "4px",
              outline: "none",
              boxShadow: "0 0 5px rgba(0, 255, 0, 0.5)",
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #0f0;
              cursor: pointer;
              box-shadow: 0 0 5px #0f0, 0 0 10px #0f0;
              transform: translateY(-5px)
            }
            input[type="range"]::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #0f0;
              cursor: pointer;
              box-shadow: 0 0 5px #0f0, 0 0 10px #0f0;
            }
            input[type="range"]::-ms-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #0f0;
              cursor: pointer;
              boxShadow: 0 0 5px #0f0, 0 0 10px #0f0;
            }
            input[type="range"]::-webkit-slider-runnable-track {
              height: 8px;
              background: linear-gradient(to right, #0f0 ${(length - 4) / (32 - 4) * 100}%, rgba(15, 15, 15, 0.8) ${(length - 4) / (32 - 4) * 100}%);
              border-radius: 4px;
            }
            input[type="range"]::-moz-range-track {
              height: 8px;
              background: linear-gradient(to right, #0f0 ${(length - 4) / (32 - 4) * 100}%, rgba(15, 15, 15, 0.8) ${(length - 4) / (32 - 4) * 100}%);
              border-radius: 4px;
            }
            input[type="range"]::-ms-track {
              height: 8px;
              background: linear-gradient(to right, #0f0 ${(length - 4) / (32 - 4) * 100}%, rgba(15, 15, 15, 0.8) ${(length - 4) / (32 - 4) * 100}%);
              border-radius: 4px;
            }
          `}</style>
        </label>

        <fieldset
          style={{
            border: "1px solid #0f0",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: 6,
          }}
        >
          <legend style={{ padding: "0 0.5rem" }}>Character Types</legend>
          {([
            { display: "lower (a-z)", key: "lower" },
            { display: "upper (A-Z)", key: "upper" },
            { display: "numbers (0-9)", key: "numbers" },
            { display: "symbols (%@!&)", key: "symbols" },
            { display: "word", key: "word" }
          ] as const).map(({ display, key }) => (
            <label key={key} style={inputLabelStyle}>
              <input
                type="checkbox"
                checked={options[key as keyof typeof options]}
                onChange={() => toggleOption(key as keyof typeof options)}
                style={checkboxStyle}
              />
              {display.charAt(0).toUpperCase() + display.slice(1)}
              {key === "word" && " (Include Word)"}
            </label>
          ))}
        </fieldset>

        {options.word && (
          <fieldset
            style={{
              border: "1px solid #0f0",
              padding: "1rem",
              marginBottom: "1rem",
              borderRadius: 6,
            }}
          >
            <legend style={{ padding: "0 0.5rem" }}>Word Case</legend>
            {(["lower", "upper", "random"] as WordCase[]).map((wc) => (
              <label key={wc} style={{ ...inputLabelStyle, display: "inline-flex", marginRight: "1.5rem" }}>
                <input
                  type="radio"
                  name="wordcase"
                  value={wc}
                  checked={wordCase === wc}
                  onChange={() => setWordCase(wc)}
                  style={radioStyle}
                />
                {wc.charAt(0).toUpperCase() + wc.slice(1)}
              </label>
            ))}
          </fieldset>
        )}

        <button
          onClick={handleGenerate}
          style={{
            width: "100%",
            padding: "0.75rem",
            fontSize: "1.25rem",
            backgroundColor: "#0f0",
            color: "black",
            border: "none",
            borderRadius: 5,
            cursor: loading ? "not-allowed" : "pointer",
            filter: loading ? "brightness(0.7)" : "none",
            boxShadow: "0 0 10px #0f0",
            userSelect: "none",
          }}
          disabled={loading}
          aria-live="polite"
          aria-busy={loading}
        >
          {loading ? "Generating..." : "Generate Password"}
        </button>

        {password && (
          <div
            ref={outputRef}
            tabIndex={0}
            role="textbox"
            aria-label="Generated password"
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "black",
              color: "#0f0",
              fontWeight: "bold",
              fontSize: "1.5rem",
              textAlign: "center",
              wordBreak: "break-word",
              userSelect: "all",
              borderRadius: 5,
              boxShadow: "0 0 10px #0f0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.75rem",
              position: "relative",
            }}
          >
            <span style={{ flex: 1 }}>{password}</span>
            <button
              onClick={handleCopy}
              aria-label="Copy password to clipboard"
              style={{
                backgroundColor: copied ? "#0f0" : "transparent",
                border: "1.5px solid #0f0",
                borderRadius: 5,
                padding: "0.25rem 0.75rem",
                color: copied ? "black" : "#0f0",
                fontWeight: "bold",
                cursor: "pointer",
                userSelect: "none",
                filter: "drop-shadow(0 0 5px #0f0)",
                transition: "background-color 0.3s, color 0.3s",
              }}
              onMouseEnter={e => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0f0";
                  (e.currentTarget as HTMLButtonElement).style.color = "black";
                }
              }}
              onMouseLeave={e => {
                if (!copied) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "#0f0";
                }
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Social Links Footer */}
        <div style={{
          position: "absolute",
          bottom: "0.5rem",
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0.5rem",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          opacity: 0.7,
          transition: "opacity 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <SocialLink href="https://paypal.me/damroyaltyxxii">PayPal</SocialLink>
          <SocialLink href="https://www.instagram.com/damroyalty">Instagram</SocialLink>
          <SocialLink href="https://www.x.com/damroyalty">X/Twitter</SocialLink>
          <SocialLink href="https://www.github.com/damroyalty">GitHub</SocialLink>
          <SocialLink href="https://linktr.ee/damroyalty">Linktree</SocialLink>
          <SocialLink href="https://www.twitch.tv/devroyalty">Twitch</SocialLink>
          <SocialLink href="https://discord.gg/kDs2mmQwwS">Discord</SocialLink>
        </div>
      </main>
    </>
  );
}