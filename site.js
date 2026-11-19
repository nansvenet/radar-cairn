/* Cairn Affinités · scripts communs à toutes les pages */
var CAIRN = window.CAIRN || {};
CAIRN.email = "cairn.affinites@gmail.com";
CAIRN.radarApp = "https://nansvenet.github.io/radar-cairn/index.html";

/* Radar SVG réutilisable.
   opts : {axes:[noms], series:[{c, v:[1..5], fill, dash}], cx, cy, R, font} */
CAIRN.radar = function (svg, opts) {
  var NS = "http://www.w3.org/2000/svg", axes = opts.axes, n = axes.length;
  var cx = opts.cx || 200, cy = opts.cy || 170, R = opts.R || 118, fs = opts.font || 12;
  function pt(i, r) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function el(t, a, parent) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; }
  for (var l = 1; l <= 5; l++) el("polygon", { points: axes.map(function (_, i) { return pt(i, R * l / 5).join(","); }).join(" "), fill: "none", stroke: "rgba(20,35,59,.10)" });
  var labels = [];
  axes.forEach(function (name, i) {
    var p = pt(i, R); el("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: "rgba(20,35,59,.10)" });
    var q = pt(i, R + 20), t = el("text", { x: q[0], y: q[1] + 4, "text-anchor": Math.abs(q[0] - cx) < 8 ? "middle" : (q[0] > cx ? "start" : "end"), "font-size": fs, fill: "#4A566B", "font-family": "Instrument Sans, system-ui, sans-serif" });
    t.textContent = name; labels.push(t);
    if (opts.onAxis) { t.style.cursor = "pointer"; t.addEventListener("click", function () { opts.onAxis(i); }); }
  });
  var groups = opts.series.map(function (s) {
    var g = el("g", {});
    var p = el("polygon", { points: "", fill: s.c, "fill-opacity": s.fill, stroke: s.c, "stroke-width": "2", "stroke-linejoin": "round" }, g);
    if (s.dash) p.setAttribute("stroke-dasharray", s.dash);
    return { g: g, p: p, s: s };
  });
  function draw(k) { groups.forEach(function (o) { o.p.setAttribute("points", o.s.v.map(function (v, i) { return pt(i, R * (v / 5) * k).join(","); }).join(" ")); }); }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) draw(1); else {
    draw(0); var started = false;
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && !started) { started = true; var t0 = null; (function step(ts) { if (!t0) t0 = ts; var x = Math.min(1, (ts - t0) / 900); draw(1 - Math.pow(1 - x, 3)); if (x < 1) requestAnimationFrame(step); })(performance.now()); } }); }, { threshold: .3 }).observe(svg);
  }
  return {
    show: function (i, on) { groups[i].g.style.display = on ? "" : "none"; },
    highlight: function (i) { labels.forEach(function (t, j) { t.setAttribute("font-weight", j === i ? "700" : "400"); t.setAttribute("fill", j === i ? "#14233B" : "#4A566B"); }); }
  };
};

(function () {
  var $ = function (id) { return document.getElementById(id); };

  // Boutons « copier »
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    var label = b.textContent;
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copié"; setTimeout(function () { b.textContent = label; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-copy")).then(done, done); else done();
    });
  });

  // Invitation : redirige vers l'application radar
  var input = $("code"), err = $("err");
  if (input) document.querySelectorAll("[data-role]").forEach(function (b) {
    b.addEventListener("click", function () {
      var code = (input.value || "").trim().toLowerCase().replace(/\s+/g, "-");
      if (!code) { err.textContent = "Saisissez le code de mission reçu dans votre invitation."; input.focus(); return; }
      err.textContent = "";
      location.href = CAIRN.radarApp + "#" + b.getAttribute("data-role") + "-" + encodeURIComponent(code);
    });
  });

  // Recherche dans la FAQ
  var fq = $("faq-q");
  if (fq) fq.addEventListener("input", function () {
    var q = this.value.trim().toLowerCase(), any = false;
    document.querySelectorAll(".faq-group").forEach(function (g) {
      var vis = 0;
      g.querySelectorAll("details").forEach(function (d) {
        var ok = !q || d.textContent.toLowerCase().indexOf(q) > -1;
        d.classList.toggle("hidden", !ok); if (ok) vis++;
        if (q && ok) d.open = true; if (!q) d.open = false;
      });
      g.classList.toggle("hidden", !vis); if (vis) any = true;
    });
    $("faq-empty").style.display = any ? "none" : "block";
  });

  // Formulaire de contact → e-mail prérempli
  var form = $("form");
  if (form) {
    var params = new URLSearchParams(location.search);
    var objet = params.get("objet"), devis = params.get("devis");
    if (objet) { var r = form.querySelector('input[name=objet][value="' + objet + '"]'); if (r) r.checked = true; }
    var box = $("devis-box");
    if (devis && box) { box.classList.remove("hidden"); $("devis-txt").textContent = devis; }
    function sync() {
      var v = (form.querySelector("input[name=objet]:checked") || {}).value;
      document.querySelectorAll("[data-for]").forEach(function (e) { e.classList.toggle("hidden", e.getAttribute("data-for").split(" ").indexOf(v) < 0); });
    }
    form.querySelectorAll("input[name=objet]").forEach(function (r) { r.addEventListener("change", sync); });
    sync();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = function (n) { var x = form.elements[n]; return x ? (x.value || "").trim() : ""; };
      var ob = form.querySelector("input[name=objet]:checked"), ferr = $("f-err");
      var lab = ob ? ob.parentNode.textContent.trim() : "Contact";
      if (!val("nom") || !/\S+@\S+\.\S+/.test(val("email"))) { ferr.textContent = "Merci d'indiquer votre nom et un e-mail valide."; return; }
      ferr.textContent = "";
      var lines = ["Objet : " + lab, "Nom : " + val("nom"), "E-mail : " + val("email")];
      ["entreprise:Entreprise", "tel:Téléphone", "poste:Poste", "ville:Ville", "date:Arrivée souhaitée", "taille:Taille de l'équipe"].forEach(function (p) {
        var k = p.split(":"), f = form.elements[k[0]];
        if (f && !f.closest(".hidden") && val(k[0])) lines.push(k[1] + " : " + val(k[0]));
      });
      if (val("msg")) lines.push("", "Message : " + val("msg"));
      if (devis && $("joindre") && $("joindre").checked) lines.push("", devis);
      var subj = lab + " · " + (val("entreprise") || val("nom"));
      location.href = "mailto:" + CAIRN.email + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(lines.join("\n"));
    });
  }
})();
