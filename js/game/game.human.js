if(!game.human){
	game.human = {};
}

(function(){
	/**
	 * Déclenchée lorsqu'un humain clique sur un emplacement du plateau de jeu
	 **/
	game.human.onclickPiece = function(domElement){
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
							}
						} else {
							game.endTurn();
						}
					}
					break;
					
				case 1:
					if(game.removePiece(domElement)){
						game.state = 0;
						game.endTurn();
					}
					break;
			}
			
			// 1ere game.phase de jeu (on pose les pions)
			//game.human.game.phase1(domElement);
		} else {
			// 2eme game.phase de jeu
			//game.human.game.phase2(domElement);
			
			if(game.player.placedPiece == 2){
				game.endParty(game.enemy);
			}
			
			switch (game.state){
				default:
				case 0:
					//game.logs("Sélectionnez un pion à déplacer.");
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