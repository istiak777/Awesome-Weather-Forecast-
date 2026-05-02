# Awesome Weather Forecast

Static **European & Dhaka city weather** dashboard: live conditions, air-quality detail, wind and sun panels, and a seven-day snapshot. The UI is plain HTML, CSS, and JavaScript—no build step required.

## Features

- City picker (Munich, London, Paris, Berlin, Dhaka) with coordinates aligned to `city_coordinates.csv`
- Current temperature, “feels like”, conditions (WMO weather codes), cloud cover
- Metric tiles: EU AQI, wind, humidity, visibility, pressure, dew point
- Tabbed details: overview, **air quality** (pollutants + 24h AQI bars), wind, sun & UV
- Seven-day forecast with rain probability

## Data sources

- **[Open-Meteo](https://open-meteo.com/)** — forecast and current weather (browser-friendly API)
- **[Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api)** — AQI and pollutant estimates
- **[7Timer](https://www.7timer.info/)** — credited in the app; useful for astronomy-style products if you extend the project

## Run locally

1. Clone the repository.
2. Open `index.html` in a browser **or** serve the folder over HTTP (recommended so `fetch` behaves consistently), for example:
   - VS Code: “Live Server”
   - Python: `python -m http.server 8080` from the project root, then visit `http://localhost:8080`

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Markup and structure |
| `css/master.css` | Layout and theme |
| `js/main.js` | API calls, rendering, tabs |
| `city_coordinates.csv` | Reference lat/lon list |
| `images/` | Local weather icons (optional / legacy assets) |

## Contributing

Issues and pull requests are welcome. Keep changes focused and match existing HTML/CSS style where possible.

## License

Specify your license here (e.g. MIT) if you want the repo to be clearly reusable.
