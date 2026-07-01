(function(){
  var STORE_KEY = "budget_expenses_v2";
  var COLORS = ["#7c8cff","#5fd3a3","#f3c969","#ef8e6a","#e87ba4","#6ad1e0","#b39ddb","#9aa0ab"];

  var expenses = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");

  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(expenses)); }
  function fmt(n){ return Math.round(n).toLocaleString(); }

  function todayStr(){
    var d = new Date();
    return d.toISOString().slice(0,10);
  }
  document.getElementById("date").value = todayStr();
  document.getElementById("todayLabel").textContent = new Date().toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});

  var sheetOverlay = document.getElementById("sheetOverlay");
  document.getElementById("addFab").onclick = function(){ sheetOverlay.classList.add("open"); };
  document.getElementById("cancelBtn").onclick = function(){ sheetOverlay.classList.remove("open"); };
  sheetOverlay.onclick = function(e){ if(e.target === sheetOverlay) sheetOverlay.classList.remove("open"); };

  document.getElementById("clearBtn").onclick = function(){
    if(confirm("Clear all expense data? This cannot be undone.")){
      expenses = []; save(); renderAll();
    }
  };

  document.getElementById("saveBtn").onclick = function(){
    var date = document.getElementById("date").value || todayStr();
    var category = document.getElementById("category").value;
    var amount = parseFloat(document.getElementById("amount").value);
    var note = document.getElementById("note").value.trim();
    if(!amount || amount <= 0){
      alert("Enter a valid amount.");
      return;
    }
    expenses.push({ id: Date.now(), date: date, category: category, amount: amount, note: note });
    save();
    document.getElementById("amount").value = "";
    document.getElementById("note").value = "";
    sheetOverlay.classList.remove("open");
    renderAll();
  };

  function deleteExpense(id){
    expenses = expenses.filter(function(e){ return e.id !== id; });
    save();
    renderAll();
  }

  var tabs = document.querySelectorAll(".tab");
  var views = { overview: document.getElementById("view-overview"), trend: document.getElementById("view-trend"), history: document.getElementById("view-history") };
  tabs.forEach(function(t){
    t.onclick = function(){
      tabs.forEach(function(x){ x.classList.remove("active"); });
      t.classList.add("active");
      Object.keys(views).forEach(function(k){ views[k].style.display = (k === t.dataset.view) ? "" : "none"; });
    };
  });

  var pieChart = null, trendChart = null;

  function renderHero(){
    var total = expenses.reduce(function(s,e){ return s + e.amount; }, 0);
    document.getElementById("totalAmount").innerHTML = fmt(total) + "<span>NOK</span>";

    var now = new Date();
    var monthTotal = expenses.filter(function(e){
      var d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce(function(s,e){ return s + e.amount; }, 0);
    document.getElementById("monthAmount").textContent = fmt(monthTotal) + " NOK";
    document.getElementById("txCount").textContent = expenses.length;

    var byCat = {};
    expenses.forEach(function(e){ byCat[e.category] = (byCat[e.category]||0) + e.amount; });
    var top = Object.keys(byCat).sort(function(a,b){ return byCat[b]-byCat[a]; })[0];
    document.getElementById("topCat").textContent = top || "—";
  }

  function renderPie(){
    var byCat = {};
    expenses.forEach(function(e){ byCat[e.category] = (byCat[e.category]||0) + e.amount; });
    var labels = Object.keys(byCat);
    var data = labels.map(function(l){ return byCat[l]; });
    var total = data.reduce(function(a,b){ return a+b; }, 0);

    var emptyEl = document.getElementById("pieEmpty");
    var boxEl = document.getElementById("pieBox");
    if(labels.length === 0){
      emptyEl.style.display = "";
      boxEl.style.display = "none";
      document.getElementById("pieLegend").innerHTML = "";
      return;
    }
    emptyEl.style.display = "none";
    boxEl.style.display = "";

    var ctx = document.getElementById("pieChart");
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: labels.map(function(_,i){ return COLORS[i % COLORS.length]; }), borderColor: "#15181e", borderWidth: 3 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "62%",
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){
          var pct = ((ctx.parsed / total) * 100).toFixed(0);
          return ctx.label + ": " + fmt(ctx.parsed) + " NOK (" + pct + "%)";
        } } } }
      }
    });

    var legend = document.getElementById("pieLegend");
    legend.innerHTML = labels.map(function(l,i){
      var pct = ((byCat[l]/total)*100).toFixed(0);
      return '<div class="legend-item"><span class="dot" style="background:'+COLORS[i%COLORS.length]+'"></span>'+l+' · '+pct+'%</div>';
    }).join("");
  }

  function renderTrend(){
    var days = [];
    for(var i=6;i>=0;i--){
      var d = new Date();
      d.setDate(d.getDate()-i);
      days.push(d.toISOString().slice(0,10));
    }
    var totals = days.map(function(day){
      return expenses.filter(function(e){ return e.date === day; }).reduce(function(s,e){ return s+e.amount; }, 0);
    });
    var labels = days.map(function(d){ var dt = new Date(d); return dt.toLocaleDateString(undefined,{weekday:"short"}); });

    var ctx = document.getElementById("trendChart");
    if(trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: "bar",
      data: { labels: labels, datasets: [{ label: "Spending", data: totals, backgroundColor: "#7c8cff", borderRadius: 6, maxBarThickness: 28 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx){ return fmt(ctx.parsed.y) + " NOK"; } } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#9aa0ab" } },
          y: { grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#9aa0ab", callback: function(v){ return fmt(v); } } }
        }
      }
    });
  }

  var CAT_EMOJI = { Food:"🍔", Rent:"🏠", Transport:"🚌", Shopping:"🛍️", Bills:"📄", Entertainment:"🎬", Health:"💊", Other:"💳" };

  function renderHistory(){
    var emptyEl = document.getElementById("txEmpty");
    var list = document.getElementById("txList");
    var sorted = expenses.slice().sort(function(a,b){ return new Date(b.date) - new Date(a.date) || b.id - a.id; });
    if(sorted.length === 0){
      emptyEl.style.display = "";
      list.innerHTML = "";
      return;
    }
    emptyEl.style.display = "none";
    list.innerHTML = sorted.map(function(e){
      var idx = Object.keys(CAT_EMOJI).indexOf(e.category);
      var color = COLORS[(idx >= 0 ? idx : 7) % COLORS.length];
      var dateLabel = new Date(e.date).toLocaleDateString(undefined,{month:"short",day:"numeric"});
      return '<div class="tx">'+
        '<div class="tx-icon" style="background:'+color+'22;">'+ (CAT_EMOJI[e.category]||"💳") +'</div>'+
        '<div class="tx-info"><div class="tx-cat">'+e.category+'</div><div class="tx-note">'+(e.note || "No note")+'</div></div>'+
        '<div class="tx-right"><div class="tx-amt">'+fmt(e.amount)+' NOK</div><div class="tx-date">'+dateLabel+'</div></div>'+
        '<button class="tx-del" data-id="'+e.id+'" aria-label="Delete transaction">&times;</button>'+
      '</div>';
    }).join("");
    Array.prototype.forEach.call(list.querySelectorAll(".tx-del"), function(btn){
      btn.onclick = function(){ deleteExpense(Number(btn.dataset.id)); };
    });
  }

  function renderAll(){
    renderHero();
    renderPie();
    renderTrend();
    renderHistory();
  }

  renderAll();
})();
