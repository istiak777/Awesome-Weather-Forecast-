(function () {
  'use strict';

  var CITY_COORDS = {
    munich: { lat: 48.135, lon: 11.582 },
    london: { lat: 51.507, lon: -0.127 },
    paris: { lat: 48.856, lon: 2.352 },
    berlin: { lat: 52.52, lon: 13.405 },
    dhaka: { lat: 23.81, lon: 90.413 }
  };

  function weatherLabel(code) {
    if (code === 0) return { text: 'Clear sky', emoji: '☀️' };
    if (code === 1) return { text: 'Mainly clear', emoji: '🌤️' };
    if (code === 2) return { text: 'Partly cloudy', emoji: '⛅' };
    if (code === 3) return { text: 'Overcast', emoji: '☁️' };
    if (code === 45 || code === 48) return { text: 'Fog', emoji: '🌫️' };
    if (code >= 51 && code <= 55) return { text: 'Drizzle', emoji: '🌦️' };
    if (code >= 56 && code <= 57) return { text: 'Freezing drizzle', emoji: '🌨️' };
    if (code >= 61 && code <= 65) return { text: 'Rain', emoji: '🌧️' };
    if (code >= 66 && code <= 67) return { text: 'Freezing rain', emoji: '🌨️' };
    if (code >= 71 && code <= 77) return { text: 'Snow', emoji: '❄️' };
    if (code >= 80 && code <= 82) return { text: 'Rain showers', emoji: '🌦️' };
    if (code >= 85 && code <= 86) return { text: 'Snow showers', emoji: '🌨️' };
    if (code === 95) return { text: 'Thunderstorm', emoji: '⛈️' };
    if (code >= 96 && code <= 99) return { text: 'Thunderstorm & hail', emoji: '⛈️' };
    return { text: 'Weather', emoji: '🌡️' };
  }

  function windDirection(deg) {
    if (deg == null || isNaN(deg)) return '—';
    var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function aqiBand(eu) {
    if (eu == null) return { label: 'No data', className: 'aqi-unknown' };
    if (eu <= 20) return { label: 'Good', className: 'aqi-good' };
    if (eu <= 40) return { label: 'Fair', className: 'aqi-fair' };
    if (eu <= 60) return { label: 'Moderate', className: 'aqi-moderate' };
    if (eu <= 80) return { label: 'Poor', className: 'aqi-poor' };
    if (eu <= 100) return { label: 'Very poor', className: 'aqi-verypoor' };
    return { label: 'Extreme', className: 'aqi-extreme' };
  }

  function formatHour(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function formatDay(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function metricItem(label, value, hint) {
    var li = el('li', 'metric-item');
    li.appendChild(el('span', 'metric-label', label));
    li.appendChild(el('span', 'metric-value', value));
    if (hint) li.appendChild(el('span', 'metric-hint', hint));
    return li;
  }

  function windToKmH(value, unit) {
    if (value == null || isNaN(value)) return null;
    if (unit === 'm/s' || unit === 'ms') return Math.round(value * 3.6);
    if (unit === 'mph') return Math.round(value * 1.60934);
    if (unit === 'kn') return Math.round(value * 1.852);
    return Math.round(value);
  }

  function buildForecastUrl(lat, lon) {
    var u = new URL('https://api.open-meteo.com/v1/forecast');
    u.searchParams.set('latitude', String(lat));
    u.searchParams.set('longitude', String(lon));
    u.searchParams.set('wind_speed_unit', 'kmh');
    u.searchParams.set(
      'current',
      [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'uv_index',
        'is_day',
        'visibility',
        'dew_point_2m',
        'precipitation'
      ].join(',')
    );
    u.searchParams.set(
      'daily',
      [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_probability_max'
      ].join(',')
    );
    u.searchParams.set('timezone', 'auto');
    u.searchParams.set('forecast_days', '7');
    return u.toString();
  }

  function buildAirUrl(lat, lon) {
    var u = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    u.searchParams.set('latitude', String(lat));
    u.searchParams.set('longitude', String(lon));
    u.searchParams.set(
      'current',
      [
        'european_aqi',
        'us_aqi',
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone'
      ].join(',')
    );
    u.searchParams.set('hourly', 'european_aqi');
    u.searchParams.set('timezone', 'auto');
    u.searchParams.set('forecast_days', '2');
    return u.toString();
  }

  function renderAqiChart(container, hourly) {
    container.innerHTML = '';
    if (!hourly || !hourly.time || !hourly.european_aqi) return;
    var times = hourly.time;
    var values = hourly.european_aqi;
    var n = Math.min(24, times.length);
    var start = Math.max(0, times.length - n);
    var maxV = 20;
    for (var i = start; i < times.length; i++) {
      var val = values[i];
      if (val != null && val > maxV) maxV = val;
    }
    if (maxV < 40) maxV = 40;
    var wrap = el('div', 'aqi-chart-bars');
    for (var j = start; j < times.length; j++) {
      var v = values[j];
      var h = v == null ? 4 : Math.max(8, Math.round((v / maxV) * 100));
      var bar = el('div', 'aqi-bar');
      bar.style.height = h + '%';
      bar.title =
        formatHour(times[j]) + ': ' + (v != null ? v : '—');
      wrap.appendChild(bar);
    }
    container.appendChild(wrap);
  }

  function renderForecastCards(container, daily, dailyUnits) {
    container.innerHTML = '';
    if (!daily || !daily.time) return;
    for (var i = 0; i < daily.time.length; i++) {
      var code = daily.weather_code[i];
      var w = weatherLabel(code);
      var card = el('article', 'forecast-card');
      card.appendChild(el('h3', null, formatDay(daily.time[i])));
      var emoji = el('p', 'forecast-emoji', w.emoji);
      emoji.setAttribute('aria-hidden', 'true');
      card.appendChild(emoji);
      card.appendChild(el('p', 'forecast-condition', w.text));
      var max = daily.temperature_2m_max[i];
      var min = daily.temperature_2m_min[i];
      var prob = daily.precipitation_probability_max
        ? daily.precipitation_probability_max[i]
        : null;
      var temp = el('div', 'temperature');
      temp.innerHTML =
        'H: ' +
        Math.round(max) +
        '° · L: ' +
        Math.round(min) +
        '°' +
        (prob != null ? '<br><span class="temp-meta">Rain ' + prob + '%</span>' : '');
      card.appendChild(temp);
      container.appendChild(card);
    }
  }

  function setTab(tabId) {
    var tabs = document.querySelectorAll('.detail-tab');
    var panels = document.querySelectorAll('.tab-panel');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var active = t.getAttribute('data-tab') === tabId;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    }
    for (var j = 0; j < panels.length; j++) {
      var p = panels[j];
      var id = p.id.replace('panel-', '');
      var show = id === tabId;
      p.classList.toggle('is-active', show);
      if (show) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    }
  }

  function updateDashboard(cityLabel, coords, weather, air) {
    var status = document.getElementById('dashboard-status');
    var cur = weather.current;
    var daily = weather.daily;
    var cu = weather.current_units || {};
    var windUnit = cu.wind_speed_10m || 'km/h';
    var d0 = daily && daily.time && daily.time[0];
    var w = weatherLabel(cur.weather_code);

    document.getElementById('now-location').textContent = cityLabel;
    document.querySelector('.now-temp-value').textContent =
      cur.temperature_2m != null ? String(Math.round(cur.temperature_2m)) : '—';
    document.getElementById('now-condition').textContent = w.emoji + ' ' + w.text;
    document.getElementById('now-feels').textContent =
      cur.apparent_temperature != null
        ? 'Feels like ' + Math.round(cur.apparent_temperature) + '°C'
        : 'Feels like —';
    document.getElementById('now-cloud').textContent =
      cur.cloud_cover != null ? 'Cloud cover ' + Math.round(cur.cloud_cover) + '%' : '';

    var grid = document.getElementById('metrics-grid');
    grid.innerHTML = '';
    var visKm =
      cur.visibility != null ? (cur.visibility / 1000).toFixed(1) + ' km' : '—';
    var dew =
      cur.dew_point_2m != null ? Math.round(cur.dew_point_2m) + '°C' : '—';
    var euAqi = air && air.current ? air.current.european_aqi : null;
    var band = aqiBand(euAqi);
    var aqiText = euAqi != null ? String(euAqi) + ' · ' + band.label : '—';

    grid.appendChild(
      metricItem('Air (EU AQI)', aqiText, euAqi != null ? 'Live estimate' : '')
    );
    var windKm = windToKmH(cur.wind_speed_10m, windUnit);
    grid.appendChild(
      metricItem(
        'Wind',
        windKm != null ? windKm + ' km/h' : '—',
        windDirection(cur.wind_direction_10m)
      )
    );
    grid.appendChild(
      metricItem(
        'Humidity',
        cur.relative_humidity_2m != null ? cur.relative_humidity_2m + '%' : '—',
        ''
      )
    );
    grid.appendChild(metricItem('Visibility', visKm, ''));
    grid.appendChild(
      metricItem(
        'Pressure',
        cur.pressure_msl != null ? Math.round(cur.pressure_msl) + ' hPa' : '—',
        ''
      )
    );
    grid.appendChild(metricItem('Dew point', dew, ''));

    var overviewText = document.getElementById('panel-overview-text');
    var precip = cur.precipitation != null ? cur.precipitation : 0;
    var probToday =
      daily && daily.precipitation_probability_max
        ? daily.precipitation_probability_max[0]
        : null;
    overviewText.textContent =
      'Right now: ' +
      w.text.toLowerCase() +
      '. Recent precipitation ' +
      precip +
      ' mm.' +
      (probToday != null
        ? ' Today’s chance of rain is about ' + probToday + '%.'
        : '');

    var extras = document.getElementById('overview-extras');
    extras.innerHTML = '';
    if (daily && daily.uv_index_max) {
      extras.appendChild(
        el('li', null, 'UV index (today): up to ' + daily.uv_index_max[0].toFixed(1))
      );
    }
    if (cur.uv_index != null) {
      extras.appendChild(el('li', null, 'UV right now: ' + cur.uv_index.toFixed(1)));
    }

    var airSummary = document.getElementById('air-summary');
    airSummary.innerHTML = '';
    if (air && air.current) {
      var c = air.current;
      var us = c.us_aqi;
      var line =
        'European AQI ' +
        (c.european_aqi != null ? c.european_aqi : '—') +
        ' (' +
        band.label +
        ').';
      if (us != null) line += ' US AQI ' + us + '.';
      var p = el('p', 'air-summary-text', line);
      airSummary.appendChild(p);
    } else {
      airSummary.appendChild(
        el(
          'p',
          'air-summary-text',
          'Air quality is not available for this location in the dataset.'
        )
      );
    }

    var pollutants = document.getElementById('pollutant-grid');
    pollutants.innerHTML = '';
    if (air && air.current) {
      var ac = air.current;
      var rows = [
        ['PM2.5', ac.pm2_5, 'µg/m³'],
        ['PM10', ac.pm10, 'µg/m³'],
        ['NO₂', ac.nitrogen_dioxide, 'µg/m³'],
        ['O₃', ac.ozone, 'µg/m³'],
        ['SO₂', ac.sulphur_dioxide, 'µg/m³'],
        ['CO', ac.carbon_monoxide, 'µg/m³']
      ];
      for (var r = 0; r < rows.length; r++) {
        var val = rows[r][1];
        pollutants.appendChild(
          metricItem(
            rows[r][0],
            val != null ? String(Math.round(val * 10) / 10) : '—',
            rows[r][2]
          )
        );
      }
    }

    renderAqiChart(document.getElementById('aqi-chart'), air ? air.hourly : null);

    var windStats = document.getElementById('wind-stats');
    windStats.innerHTML = '';
    var gustKm = windToKmH(cur.wind_gusts_10m, windUnit);
    windStats.appendChild(
      el(
        'li',
        null,
        'Speed: ' +
          (windKm != null
            ? windKm + ' km/h' +
              (windUnit === 'm/s' || windUnit === 'ms'
                ? ' (' + cur.wind_speed_10m.toFixed(1) + ' m/s)'
                : '')
            : '—')
      )
    );
    windStats.appendChild(
      el(
        'li',
        null,
        'Direction: ' +
          windDirection(cur.wind_direction_10m) +
          (cur.wind_direction_10m != null
            ? ' (' + Math.round(cur.wind_direction_10m) + '°)'
            : '')
      )
    );
    windStats.appendChild(
      el(
        'li',
        null,
        'Gusts: ' + (gustKm != null ? gustKm + ' km/h' : '—')
      )
    );

    var sunStats = document.getElementById('sun-stats');
    sunStats.innerHTML = '';
    var sunNote = document.getElementById('sun-note');
    if (daily && daily.sunrise && daily.sunset && daily.sunrise[0]) {
      var sr = new Date(daily.sunrise[0]);
      var ss = new Date(daily.sunset[0]);
      var dayMin = Math.round((ss - sr) / 60000);
      var h = Math.floor(dayMin / 60);
      var mn = dayMin % 60;
      sunStats.appendChild(
        el('li', null, 'Sunrise: ' + sr.toLocaleTimeString(undefined, { timeStyle: 'short' }))
      );
      sunStats.appendChild(
        el('li', null, 'Sunset: ' + ss.toLocaleTimeString(undefined, { timeStyle: 'short' }))
      );
      sunStats.appendChild(el('li', null, 'Daylight: ' + h + ' h ' + mn + ' min'));
      var uvmx = daily.uv_index_max ? daily.uv_index_max[0] : null;
      sunNote.textContent =
        uvmx != null
          ? 'Peak UV today near ' + uvmx.toFixed(1) + ' — protect skin around solar noon.'
          : '';
    } else {
      sunNote.textContent = '';
    }

    renderForecastCards(
      document.getElementById('forecast-container'),
      daily,
      weather.daily_units
    );

    status.textContent = 'Updated ' + new Date().toLocaleTimeString();
    status.className = 'dashboard-status is-ok';
  }

  function loadCity(cityKey, cityLabel) {
    var coords = CITY_COORDS[cityKey];
    var status = document.getElementById('dashboard-status');
    if (!coords) {
      status.textContent = 'Unknown city key.';
      status.className = 'dashboard-status is-error';
      return;
    }
    status.textContent = 'Loading…';
    status.className = 'dashboard-status is-loading';

    var wUrl = buildForecastUrl(coords.lat, coords.lon);
    var aUrl = buildAirUrl(coords.lat, coords.lon);

    Promise.all([
      fetch(wUrl).then(function (r) {
        if (!r.ok) throw new Error('Weather request failed');
        return r.json();
      }),
      fetch(aUrl).then(function (r) {
        if (!r.ok) throw new Error('Air quality request failed');
        return r.json();
      })
    ])
      .then(function (pair) {
        updateDashboard(cityLabel, coords, pair[0], pair[1]);
      })
      .catch(function () {
        status.textContent =
          'Could not load data (network, CORS, or API error). Try again or use a local server.';
        status.className = 'dashboard-status is-error';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var citySelect = document.getElementById('city');
    if (!citySelect) return;

    document.querySelectorAll('.detail-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tab');
        if (id) setTab(id);
      });
    });

    function refresh() {
      var opt = citySelect.options[citySelect.selectedIndex];
      var key = citySelect.value;
      var label = opt ? opt.text.trim() : key;
      loadCity(key, label);
    }

    citySelect.addEventListener('change', refresh);
    refresh();
  });
})();
