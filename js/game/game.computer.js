if(!game.computer){
	game.computer = {};
}

(function(){
	/**
	 * Lancé de dé aléatoire. Plus l'ordinateur a un niveau élevé, et plus il est lui est facile d'obtenir un "true".
	 **/
	game.computer.diceRoll = function(){
		if(game.player.level == "1")
			var goal = 3;
		
		if(game.player.level == "2")
			var goal = 5;
		
		if(game.player.level == "3")
			var goal = 7;
		
		return (Math.floor((Math.random()*10)+1) <= goal);
	}
	
	/**
	 * L'ordinateur essaie de trouver une combinaison potentiellement gagnante 
	 * pour le joueur, afin de placer un pion et terminer une ligne avant lui.
	 **/
	game.computer.tryToCounter = function(){		
		// On boucle sur toutes les combinaison possible
		for(var i = 0; i < game.mills.length; i++){
			
			// On s'attarde sur la ligne uniquement si elle n'est pas déjà complétée.
			if(game.mills[i].check == false){
				
				// On récupère les infos sur la ligne courante
				var lineData = game.getPieceOnLine(i);
				
				// Si le joueur dispose de 2/3 piece, et que le computer n'en a pas, c'est qu'il y'a un coup à bloquer.
				// On fait un jet de dé pour définir si le computer a "vu" ou non le coup à jouer.
				if(lineData.enemyCount == 2 && lineData.playerCount == 0 && game.computer.diceRoll()){
					console.log(game.player.name + " a trouvé un coup à contrer");
					return lineData.available[0];
					break;
				}
			}
		}
		
		return false;
	}
	
	/**
	 * Ici, l'ordinateur va tenter de compléter une ligne (en fonction d'une certaine tolérance)
	 * Pour commencer, on lance la fonction avec une tolérance de "2", ce qui veux dire qu'il 
	 * essaiera de compléter sa ligne si il trouve 2 de ses piece dessus.
	 **/
	game.computer.tryToFindPieceForCompleteMill = function(tolerance){		
		for(var i = 0; i < game.mills.length; i++){
			
			if(game.mills[i].check == false){
				
				var lineData = game.getPieceOnLine(i);
				
				if(lineData.playerCount == tolerance && lineData.enemyCount == 0 && game.computer.diceRoll()){
					console.log(game.player.name + " a trouvé un moulin (" + tolerance + "/3) à compléter");
					return lineData.available[0];
					break;
				}
			}
		}
		
		return false;
	}
	
	game.computer.TryToRemoveEnemyPiece = function(){

		finished = false;
		
		while(finished == false){
			var row = Math.floor((Math.random()*15)+1);
			var col = Math.floor((Math.random()*3));
			var target = $('#piece' + game.mills[row].piece[col]);
									
			if(target.hasClass(game.enemy.color)){	
				if(!game.checkIfPieceIsInMill(target) || !game.checkIfOnePieceExistOutOfMill()){
					game.removePiece(target);
					game.millCheck();
					return true;
					break;
				}
			}
		}
	}
	
	game.computer.randomPiece = function(){		
		var finished = false;
		while(finished == false){
			var row = Math.floor((Math.random()*15)+1);
			var col = Math.floor((Math.random()*3));
			var target = $('#piece' + game.mills[row].piece[col]);

			if(game.isFree(target)){
				console.log(game.player.name + " a posé un pion au hasard");
				return target;
				break;
			}
		}
		
		return false;
	}
	
	game.computer.findTargetMoveExistingMill = function(){
		// On boucle sur tous les moulins possible
		for(var i = 0; i < game.mills.length; i++){
			
			// Si on rencontre un moulin déjà formé
			if(game.mills[i].check == true){
				
				var lineData = game.getPieceOnLine(i);
				
				// On vérifie que ce mill est bien le notre
				if(lineData.playerCount == 3 && game.computer.diceRoll()){
					
					// Pour chaque pion de ce mill
					for(var j = 0; j < 3; j++){
						
						// On boucle sur les mouvement possible de ce pion
						for(var k = 0; k < game.movement[game.mills[i].piece[j]].length; k++){
							
							var starting = $("#piece" + game.mills[i].piece[j]);
							var arrival = $("#piece" + game.movement[game.mills[i].piece[j]][k]);
							
							if(game.isFree(arrival)){
								
								// Mise en place d'une stratégie
								game.player.strategies = [];
								game.player.strategies.push({starting: arrival, arrival: starting});
								
								console.log(game.player.name + " viens de casser un moulin");
								
								return {starting: starting, arrival: arrival};
								break;
							}
						}						
					}
				}
			}
		}
		
		return false;
	}
	
	game.computer.findMoveForNewMill = function(deep){
		
		// On boucle sur tous les mill possible
		for(var i = 0; i < game.mills.length; i++){
			
			// On regarde ceux qui sont incomplet
			if(game.mills[i].check == false){
				
				var lineData = game.getPieceOnLine(i);
				
				// On constate qu'un mill est potentiellement fesable
				if(lineData.playerCount == 2 && lineData.enemyCount == 0 && game.computer.diceRoll()){
					// On boucle sur toutes les mouvements possible de la case
					var availableMove = lineData.available[0];
					var availableMoveID = parseInt(availableMove.attr('id').replace(new RegExp("piece"), ""));
					
					for(var j = 0; j < game.movement[availableMoveID].length; j++){
						var possibleMoveID = game.movement[availableMoveID][j];
						var possibleMove = $("#piece" + possibleMoveID);
						
						deep--;
						
						// Si un pion est sur la case, et que c'est le notre
						if(!game.isFree(possibleMove) && possibleMove.hasClass(game.player.color) && game.mills[i].piece.indexOf(possibleMoveID) == -1){
							console.log(game.player.name + " a trouvé un mouvement gagnant en 1 coup");
							return {starting: possibleMove, arrival: availableMove};
						} else if(game.isFree(possibleMove) && deep > 0){
							
							for(var k = 0; k < game.movement[possibleMoveID].length; k++){
								var possibleMoveID2 = game.movement[possibleMoveID][k];
								var possibleMove2 = $("#piece" + possibleMoveID2);
								
								deep--;
								
								if(!game.isFree(possibleMove2) && possibleMove2.hasClass(game.player.color) && game.mills[i].piece.indexOf(possibleMoveID2) == -1){
									game.player.strategies.push({starting: possibleMove, arrival: availableMove});
									console.log(game.player.name + " a trouvé un mouvement gagnant en 2 coups");
									return {starting: possibleMove2, arrival: possibleMove};
								} else if(game.isFree(possibleMove2) && deep > 0){
							
									for(var l = 0; l < game.movement[possibleMoveID2].length; l++){
										var possibleMoveID3 = game.movement[possibleMoveID2][l];
										var possibleMove3 = $("#piece" + possibleMoveID3);
																				
										if(!game.isFree(possibleMove3) && possibleMove3.hasClass(game.player.color) && game.mills[i].piece.indexOf(possibleMoveID3) == -1){
											game.player.strategies.push({starting: possibleMove2, arrival: possibleMove});
											console.log(game.player.name + " a trouvé un mouvement gagnant en 3 coups");
											return {starting: possibleMove3, arrival: possibleMove2};
										}
									}
								}
							}
						}
					}
				}
			}
		}
		
		return false;
	}
	
	game.computer.findRandomMove = function(){
		var myPieces = $("#board .piece."+ game.player.color);
		
		for(var i = 0; i < 200; i++){
			var startingPointID = parseInt($(myPieces[Math.floor(Math.random()* myPieces.length)]).attr('id').replace(new RegExp("piece"), ""));
			
			if(game.player.placedPiece <= 3){
				var freeLoc = $("#board .piece:not(.white):not(.black)");
				var possibleTarget = $(freeLoc[Math.floor(Math.random()* freeLoc.length)]);				
			} else {
				var possibleTarget = $('#piece' + game.movement[startingPointID][Math.floor(Math.random()* game.movement[startingPointID].length)]);
			}
			
			if(game.isFree(possibleTarget)){
				console.log(game.player.name + " fait un mouvement aléatoire");
				return {starting: $("#piece" + startingPointID), arrival: possibleTarget};
			}			
		}
		
		return false;
	}
	
	/**
	 * L'ordinateur essaie de trouver une combinaison potentiellement gagnante 
	 * pour le joueur, afin de placer un pion et terminer une ligne avant lui.
	 **/
	game.computer.tryToMoveForCounter = function(){		
		// On boucle sur toutes les combinaison possible
		for(var i = 0; i < game.mills.length; i++){
			
			// On s'attarde sur la ligne uniquement si elle n'est pas déjà complétée.
			if(game.mills[i].check == false){
				
				// On récupère les infos sur la ligne courante
				var lineData = game.getPieceOnLine(i);
				
				// Si le joueur dispose de 2/3 piece, et que le computer n'en a pas, c'est qu'il y'a un coup à bloquer.
				// On fait un jet de dé pour définir si le computer a "vu" ou non le coup à jouer.
				if(lineData.enemyCount == 2 && lineData.playerCount == 0 && game.computer.diceRoll()){
					
					var target = lineData.available[0];
					var targetID = parseInt(target.attr('id').replace(new RegExp("piece"), ""));
					
					for(var j = 0; j < game.movement[targetID].length; j++){
						var possibleMoveID = game.movement[targetID][j];
						var possibleMove = $("#piece" + possibleMoveID);
												
						// Si un pion est sur la case, et que c'est le notre
						if(!game.isFree(possibleMove) && possibleMove.hasClass(game.player.color)){
							console.log(game.player.name + " a trouver un coup à contrer");
							return {starting: possibleMove, arrival: target};
						}
					}					
				}
			}
		}
		
		return false;
	}
	
	game.computer.getStrategies = function(){
		if(game.player.strategies[0]){
						
			var strat = (function(strat){
				return strat;
			})(game.player.strategies[0]);
			
			if(strat.starting.hasClass(game.player.color) && game.isFree(strat.arrival)){
				game.player.strategies.splice(0, 1);			
				return strat;
			}
			
			game.player.strategies = [];
		}
		
		return false;
	}
	
	game.computer.findTarget = function(){
		var target = game.computer.tryToCounter();
		
		if(target == false)
			target = game.computer.tryToFindPieceForCompleteMill(2);
		
		if(target == false)
			target = game.computer.tryToFindPieceForCompleteMill(1);
		
		if(target == false)
			target = game.computer.randomPiece();
			
		return target;
	}
	
	game.computer.findMove = function(){
		if(game.phase == 2){
			var move = game.computer.getStrategies();
			
			if(move == false)
				move = game.computer.tryToMoveForCounter();
			
			if(move == false)
				move = game.computer.findMoveForNewMill(1);
				
			if(move == false)
				move = game.computer.findTargetMoveExistingMill();
	
			if(move == false)
				move = game.computer.findMoveForNewMill(2);
					
			if(move == false)
				if(game.computer.diceRoll())
					move = game.computer.findMoveForNewMill(3);
				
			if(move == false)
				move = game.computer.findRandomMove();
	
			return move;
		}
		
		return false;
	}
		
	game.computer.play = function(){
		console.debug(game.phase);
		switch (game.phase){
			case 0:
				return false;
				break;
			
			default:
			case 1:
				
				var target = game.computer.findTarget();
				
				if(game.placePiece(target)){
					// On vérifie si on a gagné une ligne
					if(game.millCheck()){
						game.computer.TryToRemoveEnemyPiece();
					}
				}				
				
				break;
				
			case 2:
			
				if(game.enemy.placedPiece == 2){
					game.endParty(game.player);
				}
				
				var move = game.computer.findMove();
				
				if(move == false){
					game.endParty(game.enemy);
				}
				
				if(game.movePiece(move.starting, move.arrival)){
					// On vérifie si on a gagné une ligne
					if(game.millCheck()){
						game.computer.TryToRemoveEnemyPiece();
					}
				}
				
				break;
		}
				
		game.endTurn();
	}
})();