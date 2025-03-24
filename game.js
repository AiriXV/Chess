document.addEventListener("DOMContentLoaded", () => {
    let selectedPiece = null;
    let currentTurn = "blanco";
    const turnDisplay = document.querySelector("h2");

    function isPathClear(fromIndex, toIndex, step) {
        const cells = document.querySelectorAll(".item");
        let i = fromIndex + step;
        while (i !== toIndex) {
            if (cells[i].firstChild) return false;
            i += step;
        }
        return true;
    }

    function isValidMove(piece, fromCell, toCell) {
        const pieceType = piece.alt.split("-")[1];
        const fromIndex = Array.from(fromCell.parentNode.children).indexOf(fromCell);
        const toIndex = Array.from(toCell.parentNode.children).indexOf(toCell);
        const rowDiff = Math.floor(toIndex / 8) - Math.floor(fromIndex / 8);
        const colDiff = (toIndex % 8) - (fromIndex % 8);
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (pieceType) {
            case "pawn":
                const direction = piece.alt.includes("blanco") ? -1 : 1;
                const startRow = piece.alt.includes("blanco") ? 6 : 1;
                if (colDiff === 0 && rowDiff === direction && !toCell.firstChild) return true;
                if (colDiff === 0 && rowDiff === 2 * direction && Math.floor(fromIndex / 8) === startRow && !toCell.firstChild) return true;
                if (absColDiff === 1 && rowDiff === direction && toCell.firstChild) return true;
                break;
            case "rook":
                if ((colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            case "horse":
                if ((absColDiff === 2 && absRowDiff === 1) || (absColDiff === 1 && absRowDiff === 2)) return true;
                break;
            case "bishop":
                if (absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, (rowDiff > 0 ? 8 : -8) + (colDiff > 0 ? 1 : -1))) return true;
                break;
            case "queen":
                if ((absRowDiff === absColDiff && isPathClear(fromIndex, toIndex, (rowDiff > 0 ? 8 : -8) + (colDiff > 0 ? 1 : -1))) ||
                    (colDiff === 0 && isPathClear(fromIndex, toIndex, rowDiff > 0 ? 8 : -8)) ||
                    (rowDiff === 0 && isPathClear(fromIndex, toIndex, colDiff > 0 ? 1 : -1))) return true;
                break;
            case "king":
                if (absRowDiff <= 1 && absColDiff <= 1) return true;
                break;
        }
        return false;
    }

    function isKingInCheck(color) {
        const king = document.querySelector(`img[alt='${color}-king']`).parentElement;
        return Array.from(document.querySelectorAll(".item img"))
            .filter(img => !img.alt.includes(color))
            .some(enemy => isValidMove(enemy, enemy.parentElement, king));
    }

    function checkmate() {
        const kings = document.querySelectorAll("img[alt*='king']");
        if (kings.length < 2) {
            const winner = kings[0].alt.includes("blanco") ? "Blancas" : "Negras";
            alert(`${winner} ganan por jaque mate!`);
            location.reload();
        }
    }

    document.querySelectorAll(".item img").forEach(piece => {
        piece.draggable = true;
        piece.addEventListener("dragstart", (e) => {
            if ((currentTurn === "blanco" && piece.alt.includes("blanco")) || 
                (currentTurn === "negro" && piece.alt.includes("negro"))) {
                selectedPiece = piece;
                e.dataTransfer.setData("text", "");
            } else {
                e.preventDefault();
            }
        });
    });

    document.querySelectorAll(".item").forEach(cell => {
        cell.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        cell.addEventListener("drop", (e) => {
            e.preventDefault();
            if (selectedPiece) {
                const fromCell = selectedPiece.parentElement;
                if (cell !== fromCell && isValidMove(selectedPiece, fromCell, cell)) {
                    const previousParent = selectedPiece.parentElement;
                    cell.innerHTML = "";
                    cell.appendChild(selectedPiece);
                    if (isKingInCheck(currentTurn)) {
                        alert("Movimiento inválido, el rey queda en jaque.");
                        previousParent.appendChild(selectedPiece);
                        return;
                    }
                    currentTurn = currentTurn === "blanco" ? "negro" : "blanco";
                    turnDisplay.textContent = `Turno actual: ${currentTurn}`;
                    checkmate();
                }
            }
        });
    });
});