
const canvas = document.getElementById("canvas-grafo");
const ctx = canvas.getContext("2d");
const btnAggiungiNodo = document.getElementById("aggiungi-nodo");
const btnAggiungiArco = document.getElementById("aggiungi-arco");
const btnEseguiDijkstra = document.getElementById("esegui-dijkstra");
const btnResettaGrafo = document.getElementById("resetta-grafo");
const inputNodoPartenza = document.getElementById("nodo-partenza");
const inputNodoArrivo = document.getElementById("nodo-arrivo");

// Array per memorizzare i nodi e gli archi
const nodi = [];
const archi = [];

// Dimensioni del canvas
canvas.width = 800;
canvas.height = 600;

// Variabili di stato
let inModalitaAggiungiArco = false;
let nodoSelezionato = null;

// Classe per rappresentare un nodo
class Nodo {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.collegamenti = [];
    this.selezionato = false;
  }

  // Disegna il nodo sul canvas
  disegna() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2, false);
    const gradient = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, 20);
    gradient.addColorStop(0, this.selezionato ? '#ecc94b' : '#4a5568'); /* Giallo per nodi selezionati, grigio scuro per gli altri */
    gradient.addColorStop(1, this.selezionato ? '#d69e2e' : '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#cbd5e0'; /* Bordo grigio chiaro */
    ctx.stroke();
    ctx.fillStyle = '#ecf0f1'; /* Testo bianco */
    ctx.font = '16px Arial';
    ctx.fillText(this.id, this.x - 5, this.y + 5);
  }

  aggiungiCollegamento(nodo, costo) {
    this.collegamenti.push({ nodo, costo });
  }
}

// Funzione per disegnare l'intero grafo
function disegnaGrafo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Disegna gli archi
  archi.forEach(arco => {
    ctx.beginPath();
    ctx.moveTo(arco.nodo1.x, arco.nodo1.y);
    ctx.lineTo(arco.nodo2.x, arco.nodo2.y);
    ctx.strokeStyle = '#4a5568'; /* Grigio scuro per gli archi */
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#cbd5e0'; /* Testo grigio chiaro */
    ctx.font = '16px Arial';
    ctx.fillText(
      arco.costo,
      (arco.nodo1.x + arco.nodo2.x) / 2 + 20,
      (arco.nodo1.y + arco.nodo2.y) / 2 + 10
    );
  });

  // Disegna i nodi
  nodi.forEach(nodo => nodo.disegna());
}

// Aggiungi un nodo al grafo
btnAggiungiNodo.addEventListener("click", () => {
  const idNuovoNodo = nodi.length;
  function gestisciClickAggiungiNodo(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    const nuovoNodo = new Nodo(x, y, idNuovoNodo);
    nodi.push(nuovoNodo);
    disegnaGrafo();
    canvas.removeEventListener("click", gestisciClickAggiungiNodo);
  }
  canvas.addEventListener("click", gestisciClickAggiungiNodo);
});

// Aggiungi un arco tra due nodi
btnAggiungiArco.addEventListener("click", () => {
  inModalitaAggiungiArco = true;
  nodoSelezionato = null;

  function gestisciClickAggiungiArco(e) {
    const x = e.offsetX;
    const y = e.offsetY;
    const nodoCliccato = nodi.find(nodo => {
      return Math.hypot(nodo.x - x, nodo.y - y) < 20;
    });

    if (nodoCliccato) {
      if (!nodoSelezionato) {
        nodoSelezionato = nodoCliccato;
        nodoCliccato.selezionato = true;
        disegnaGrafo();
      } else {
        const costo = prompt("Inserisci il costo dell'arco:");
        if (costo && !isNaN(costo)) {
          nodoSelezionato.aggiungiCollegamento(nodoCliccato, parseInt(costo));
          nodoCliccato.aggiungiCollegamento(nodoSelezionato, parseInt(costo));
          archi.push({ nodo1: nodoSelezionato, nodo2: nodoCliccato, costo: parseInt(costo) });
          nodoSelezionato.selezionato = false;
          disegnaGrafo();
        }
        canvas.removeEventListener("click", gestisciClickAggiungiArco);
        nodoSelezionato = null;
      }
    }
  }

  canvas.addEventListener("click", gestisciClickAggiungiArco);
});

// Algoritmo di Dijkstra
function dijkstra(idPartenza, idArrivo) {
  const distanze = {};
  const precedenti = {};
  const visitati = new Set();
  const nonVisitati = new Set(nodi);

  nodi.forEach(nodo => {
    distanze[nodo.id] = Infinity;
    precedenti[nodo.id] = null;
  });
  distanze[idPartenza] = 0;

  while (nonVisitati.size > 0) {
    const nodoCorrente = [...nonVisitati].reduce((nodoMinimo, nodo) => {
      return distanze[nodo.id] < distanze[nodoMinimo.id] ? nodo : nodoMinimo;
    });

    if (nodoCorrente.id === idArrivo) {
      break;
    }

    nonVisitati.delete(nodoCorrente);
    nodoCorrente.collegamenti.forEach(collegamento => {
      if (!visitati.has(collegamento.nodo.id)) {
        const distanzaAlternativa = distanze[nodoCorrente.id] + collegamento.costo;
        if (distanzaAlternativa < distanze[collegamento.nodo.id]) {
          distanze[collegamento.nodo.id] = distanzaAlternativa;
          precedenti[collegamento.nodo.id] = nodoCorrente;
        }
      }
    });
    visitati.add(nodoCorrente);
  }

  const percorso = [];
  let nodoCorrente = nodi.find(nodo => nodo.id === idArrivo);
  while (nodoCorrente) {
    percorso.unshift(nodoCorrente);
    nodoCorrente = precedenti[nodoCorrente.id];
  }

  return percorso;
}

// Esegui Dijkstra e evidenzia il percorso
btnEseguiDijkstra.addEventListener("click", () => {
  const nodoPartenza = parseInt(inputNodoPartenza.value);
  const nodoArrivo = parseInt(inputNodoArrivo.value);

  if (nodoPartenza >= 0 && nodoArrivo >= 0 && nodoPartenza < nodi.length && nodoArrivo < nodi.length) {
    const percorso = dijkstra(nodoPartenza, nodoArrivo);
    if (percorso.length > 0) {
      disegnaGrafo();

      let costoTotale = 0;

      const animaPercorso = (index) => {
        if (index < percorso.length - 1) {
          const nodo1 = percorso[index];
          const nodo2 = percorso[index + 1];
          const arco = archi.find(arco =>
            (arco.nodo1 === nodo1 && arco.nodo2 === nodo2) ||
            (arco.nodo1 === nodo2 && arco.nodo2 === nodo1)
          );
          if (arco) {
            ctx.beginPath();
            ctx.moveTo(nodo1.x, nodo1.y);
            ctx.lineTo(nodo2.x, nodo2.y);
            ctx.strokeStyle = '#48bb78'; /* Verde tecnologico per il percorso */
            ctx.lineWidth = 3;
            ctx.stroke();

            costoTotale += arco.costo;

            ctx.font = '16px Arial';
            ctx.fillStyle = '#cbd5e0';
            const offsetX = 20;
            const offsetY = 10;
            ctx.fillText(
              arco.costo,
              (nodo1.x + nodo2.x) / 2 + offsetX,
              (nodo1.y + nodo2.y) / 2 + offsetY
            );

            // Evidenzia i nodi
            ctx.beginPath();
            ctx.arc(nodo1.x, nodo1.y, 20, 0, Math.PI * 2, false);
            ctx.fillStyle = '#48bb78'; /* Verde tecnologico per i nodi del percorso */
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText(nodo1.id, nodo1.x - 5, nodo1.y + 5);

            ctx.beginPath();
            ctx.arc(nodo2.x, nodo2.y, 20, 0, Math.PI * 2, false);
            ctx.fillStyle = '#48bb78';
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText(nodo2.id, nodo2.x - 5, nodo2.y + 5);

            setTimeout(() => animaPercorso(index + 1), 500);
          }
        } else {
          setTimeout(() => {
            alert(`Il percorso più breve è: ${percorso.map(nodo => nodo.id).join(" -> ")}\nCosto totale: ${costoTotale}`);
          }, 500);
        }
      };

      animaPercorso(0);
    } else {
      alert("Non esiste un percorso tra i nodi selezionati.");
    }
  } else {
    alert("I nodi di partenza o arrivo non sono validi.");
  }
});

// Resetta il grafo
btnResettaGrafo.addEventListener("click", () => {
  nodi.length = 0;
  archi.length = 0;
  disegnaGrafo();
});
