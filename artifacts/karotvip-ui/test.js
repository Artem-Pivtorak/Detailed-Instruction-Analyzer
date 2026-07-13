const width = 480;
const height = 240;
const rx = 16;
const config = {
  blend: "difference",
  alpha: 0.93,
  blur: 11,
  lightness: 50,
  innerStop: 15,
};
const border = 8.4;

const svgMarkup = `
  <svg class="displacement-image" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#000"/>
        <stop offset="100%" stop-color="red"/>
      </linearGradient>
      <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000"/>
        <stop offset="100%" stop-color="blue"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="black"></rect>
    <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="url(#red)" />
    <rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="url(#blue)" style="mix-blend-mode: ${config.blend}" />
    <rect x="${border}" y="${border}" width="${width - border * 2}" height="${height - border * 2}" rx="${rx}" fill="hsl(0 0% ${config.lightness}% / ${config.alpha})" style="filter:blur(${config.blur}px)" />
  </svg>
`;

console.log(encodeURIComponent(svgMarkup.trim()));
