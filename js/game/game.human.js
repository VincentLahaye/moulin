if(!game.human){
	game.human = {};
}

(function(){
	/**
	 * Déclenchée lorsqu'un humain clique sur un emplacement du plateau de jeu
	 **/
	game.human.onclickPiece = function(domElement){
		// Si le jeu est en pause, ou que c'est le tour d'une AI de jouer, alors on ne fait rien
		if(game.player.type == 2 || game.paused == 1)
			return false;
			
		if(game.phase == 1){
			
			switch(game.state){
				default:
				case 0:
					if(game.placePiece(domElement)){
						// On vérifie si on a gagné une ligne
						if(game.millCheck()){
							console.log(game.player.name + " a gagné une ligne !");
							
							if(!game.checkIfOnePieceExistOutOfMill()){
								// Si tous les pions font parti d'un moulin, on termine le tour
								game.endTurn();
							} else {
								// Si oui, on met le "game.state" à 1 en vu de la suppresion d'un piece du computer
								game.state = 1;
								$("#logs").append('<div class="alert alert-info">Cliquez sur un pion adverse pour le supprimer.</div>');
							}
						} else {
							game.endTurn();
						}
					}
					break;
					
				case 1:
					if(game.removePiece(domElement)){
						$("#logs").html("");
						game.state = 0;
						game.endTurn();
					}
					break;
			}
		} else {			
			$("#logs").html("");
			
			if(game.player.placedPiece == 2){
				game.endParty(game.enemy);
			}
			
			switch (game.state){
				default:
				case 0:
					
					if(!$(domElement).hasClass(game.player.color)){
						console.log("Veuillez sélectionner un de VOS pions.");
					} else {
						if(!game.waitingMovement)
							game.waitingMovement = {};
						
						game.waitingMovement = $(domElement);
						game.waitingMovement.addClass('waiting');
						game.state = 2;
					}
					break;
					
				case 1:
					if(game.removePiece(domElement)){
						$("#logs").html("");
						game.state = 0;
						game.endTurn();
					}
					break;
					
				case 2:
					var startingPoint = game.waitingMovement;
					var arrivalPoint = $(domElement);
						
					if(game.movePiece(startingPoint, arrivalPoint)){
						// On vérifie si une nouvelle ligne a été complétée
						if(game.millCheck() && game.checkIfOnePieceExistOutOfMill()){
							$("#logs").append('<div class="alert alert-info">Cliquez sur un pion adverse pour le supprimer.</div>');
							game.state = 1;
						} else {
							game.state = 0;
							game.endTurn();
						}
					} else {
						game.state = 0;
					}
								
					game.waitingMovement.removeClass('waiting');
					game.waitingMovement = null;
					break;
			}
		}
	}
})();