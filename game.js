document.addEventListener("DOMContentLoaded", () => {
    let selectedPiece = null; // Pieza seleccionada para mover
    let currentTurn = "white"; // Turno actual (blancas o negras)
    let enPassantTarget = null; // Casilla objetivo para "en passant"
    const turnDisplay = document.querySelector("h2"); // Elemento para mostrar el turno


      // Verifica que no haya piezas en el camino entre origen y destino
    function isPathClear(fromIndex, toIndex, step) {
        const cells = document.querySelectorAll(".item");
        let i = fromIndex + step;
        while (i !== toIndex) {
            if (getFirstImgChild(cells[i])) {
                return false;
            }
            i += step;
        }
        return true;
    }

    function getFirstImgChild(cell) {
        for (let child of cell.children) {
            if (child.tagName.toLowerCase() === "img") {
                return child;
            }
        }
        return null
    }

    function isEatingOwnPiece(piece, toCell) {
        const clonedPiece = piece.cloneNode(true);
        const clonedToCell = toCell.cloneNode(true);
        const toPiece = getFirstImgChild(clonedToCell);
        const fromPieceColor = clonedPiece.alt.split("-")[0];

        const toHasPiece = toPiece !== null && toPiece.alt !== undefined;
        const toPieceColor = toHasPiece ? toPiece.alt.split("-")[0] : null;
        if (toHasPiece && toPieceColor === fromPieceColor) return true;
    }
 
     // Verifica si el movimiento es válido según la pieza y sus reglas 

    function isValidMove(piece, fromCell, toCell) {
        const clonedPiece = piece.cloneNode(true);
        const cloneFromCell = fromCell.cloneNode(true);
        const clonedToCell = toCell.cloneNode(true);
        const toPiece = getFirstImgChild(clonedToCell);
        const fromPieceType = clonedPiece.alt.split("-")[1]; // tipo de pieza (pawn, rook, etc.)
        const fromPieceColor = clonedPiece.alt.split("-")[0]; // color de la pieza

        if (isEatingOwnPiece(piece, toCell)) return false; // no capturar propias

        const fromIndex = Array.from(fromCell.parentNode.children).indexOf(fromCell);
        const toIndex = Array.from(toCell.parentNode.children).indexOf(toCell);
        const rowDiff = Math.floor(toIndex / 8) - Math.floor(fromIndex / 8);
        const colDiff = (toIndex % 8) - (fromIndex % 8);
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (fromPieceType) {
            case "pawn": {
                const direction = fromPieceColor === "white" ? -1 : 1;
                const startRow = fromPieceColor === "white" ? 6 : 1;
                const fromRow = Math.floor(fromIndex / 8);

                if (colDiff === 0) {
                    if (rowDiff === direction && !toPiece) return true;
                    if (rowDiff === 2 * direction && fromRow === startRow && !toPiece && !document.querySelectorAll(".item")[fromIndex + direction * 8].firstChild) {
                        enPassantTarget = document.querySelectorAll(".item")[fromIndex + direction * 8];
                        return true;
                    }
                }
                if (absColDiff === 1 && rowDiff === direction && (toPiece || (enPassantTarget === toCell))) {
                    if (enPassantTarget === toCell && !toPiece) {
                        const capturedPawnIndex = toIndex + (fromPieceColor === "white" ? 8 : -8);
                        document.querySelectorAll(".item")[capturedPawnIndex].innerHTML = "";
                    }
                    return true;
                }
                break;
            }
            case "rook": {
                if (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) return true;
                if (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1)) return true;
                break;
            }
            case "horse": {
                if ((absColDiff === 2 && absRowDiff === 1) || (absColDiff === 1 && absRowDiff === 2)) return true;
                break;
            }
            case "bishop": {
                if (absRowDiff === absColDiff) {
                    let step;
                    if (rowDiff < 0 && colDiff < 0) step = -9; // arriba izquierda
                    else if (rowDiff < 0 && colDiff > 0) step = -7; // arriba derecha
                    else if (rowDiff > 0 && colDiff < 0) step = 7; // abajo izquierda
                    else if (rowDiff > 0 && colDiff > 0) step = 9; // abajo derecha

                    if (isPathClear(fromIndex, toIndex, step)) return true;
                }
                break;
            }
            case "queen": {
                if ((absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, (rowDiff > 0 ? 8 : -8) + (colDiff > 0 ? 1 : -1))) ||
                    (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            }
            case "king": {
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                break;
            }
        }
        return false;
    }

     // Verifica si el rey actual está en jaque
    function isKingInCheck(color) {
    const king = document.querySelector(`img[alt='${color}-king']`);
    if (!king) return false; // Por si el rey fue capturado (jaque mate)

    const kingCell = king.parentElement;
    const enemyPieces = Array.from(document.querySelectorAll(".item img"))
        .filter(img => !img.alt.includes(color));

    return enemyPieces.some(enemy => {
        return isValidMove(enemy, enemy.parentElement, kingCell);
    });
}
// Verifica si hay jaque mate (un solo rey queda)
    function checkmate() {
        const kings = document.querySelectorAll("img[alt*='king']");
        if (kings.length < 2) {
            const winner = kings[0].alt.includes("white") ? "Blancas" : "Negras";
            alert(`${winner} ganan por jaque mate!`);
            location.reload();
        }
    }
// Configura el arrastre de piezas
    document.querySelectorAll(".item img").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", (e) => {
            if ((currentTurn === "white" && piece.alt.includes("white")) ||
                (currentTurn === "black" && piece.alt.includes("black"))) {
                selectedPiece = piece;
                e.dataTransfer.setData("text", "");
            } else {
                e.preventDefault();
            }
        });
    });
 // Variables temporales para finalizar el turno después de promocionar
let pendingTurnData = null;

// Configura el soltar piezas en casillas
document.querySelectorAll(".item").forEach(cell => {
    cell.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    cell.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!selectedPiece) return;

        const fromCell = selectedPiece.parentElement;
        if (cell === fromCell || !isValidMove(selectedPiece, fromCell, cell)) return;

        const previousParent = selectedPiece.parentElement;
        const capturedPiece = cell.firstChild;
        cell.innerHTML = "";
        cell.appendChild(selectedPiece);

        if (isKingInCheck(currentTurn)) {
            alert("Movimiento inválido, el rey queda en jaque.");
            previousParent.appendChild(selectedPiece);
            if (capturedPiece) cell.appendChild(capturedPiece);
            return;
        }

        const targetRow = Math.floor(Array.from(cell.parentNode.children).indexOf(cell) / 8);
        if (selectedPiece.alt.includes('pawn') && (targetRow === 0 || targetRow === 7)) {
            // Guardamos los datos necesarios para completar el turno luego de promocionar
            pendingTurnData = {
                cell, capturedPiece
            };

            const modal = document.getElementById('promotion-modal');
            const choicesDiv = document.getElementById('promotion-choices');
            const pieces = ['queen', 'rook', 'bishop', 'horse'];

            choicesDiv.innerHTML = '';
            pieces.forEach(type => {
                const img = document.createElement('img');
                img.src = `img/${currentTurn}-${type}.png`;
                img.alt = type;
                img.addEventListener('click', () => {
                    selectedPiece.alt = `${currentTurn}-${type}`;
                    selectedPiece.src = img.src;
                    modal.style.display = 'none';

                    // Finaliza el turno tras promocionar
                    finishTurnAfterPromotion();
                });
                choicesDiv.appendChild(img);
            });

            modal.style.display = 'flex';
            return;
        }

        // Si no hay promoción, terminar el turno normalmente
        endTurn();
    });
    function endTurn() {
            currentTurn = currentTurn === 'white' ? 'black' : 'white';
            turnDisplay.textContent = `Es turno del: ${currentTurn}`;
            enPassantTarget = null;
            if (isKingInCheck(currentTurn)) alert("¡Jaque!");
            simpleCheckmate();
        }

        function finishTurnAfterPromotion() {
            if (!pendingTurnData) return;
            endTurn();
            pendingTurnData = null;
        }
});
                    }
            
        );
        

