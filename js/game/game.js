// object.watch
if (!Object.prototype.watch) {
	Object.defineProperty(Object.prototype, "watch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop, handler) {
			var
			  oldval = this[prop]
			, newval = oldval
			, getter = function () {
				return newval;
			}
			, setter = function (val) {
				oldval = newval;
				return newval = handler.call(this, prop, oldval, val);
			}
			;
			
			if (delete this[prop]) { // can't watch constants
				Object.defineProperty(this, prop, {
					  get: getter
					, set: setter
					, enumerable: true
					, configurable: true
				});
			}
		}
	});
}
 
// object.unwatch
if (!Object.prototype.unwatch) {
	Object.defineProperty(Object.prototype, "unwatch", {
		  enumerable: false
		, configurable: true
		, writable: false
		, value: function (prop) {
			var val = this[prop];
			delete this[prop]; // remove accessors
			this[prop] = val;
		}
	});
}

if(!game){
	var game = {};
}

game.watch("phase", function(prop,oldval,newval){
	if(newval == 0 && game.bench){
		if(game.bench.number > 0){
			console.log("newBench");
			game.bench.number--;
			setTimeout(game.createGame, 100);
		} else {
			var t = game.formatTime(parseInt(Math.round((new Date().getTime() - game.bench.begin) / 1000)));
			$(".benchResult").append("<p>Temps total du Benchmark : <strong>"+ t +"</strong></p>");
		}
	}
	return newval;
});

(function(){
	
	/**
	 * Chaque ligne de ce tableau représente l'association des emplacement formant un moulin
	 **/
	game.mills = [
		{piece: [11, 14, 17], check: false},
		{piece: [22, 24, 26], check: false},
		{piece: [33, 34, 35], check: false},
		{piece: [41, 42, 43], check: false},
		{piece: [45, 46, 47], check: false},
		{piece: [53, 54, 55], check: false},
		{piece: [62, 64, 66], check: false},
		{piece: [71, 74, 77], check: false},
		
		{piece: [11, 41, 71], check: false},
		{piece: [22, 42, 62], check: false},
		{piece: [33, 43, 53], check: false},
		{piece: [14, 24, 34], check: false},
		{piece: [54, 64, 74], check: false},
		{piece: [35, 45, 55], check: false},
		{piece: [26, 46, 66], check: false},
		{piece: [17, 47, 77], check: false},
	];
	
	/**
	 * Chaque ligne du tableau correspond à un emplacement, et à ces mouvements autorisés
	 **/
	game.movement = {
		11: [14, 41],
		14: [11, 24, 17],
		17: [14, 47],
		22: [42, 24],
		24: [22, 26, 14, 34],
		26: [24, 46],
		33: [43, 34],
		34: [33, 24, 35],
		35: [34, 45],
		41: [11, 71, 42],
		42: [41, 22, 62, 43],
		43: [33, 42, 53],
		45: [35, 55, 46],
		46: [26, 45, 47, 66],
		47: [17, 46, 77],
		53: [43, 54],
		54: [53, 55, 64],
		55: [45, 54],
		62: [42, 64],
		64: [62, 54, 66, 74],
		66: [64, 46],
		71: [41, 74],
		74: [71, 64, 77],
		77: [74, 47],
	};
	
	game.benchResult = [0, 0, 0];
			
	/**
	 * Cette fonction est lancée lorsque la page est prête
	 **/
	game.start = function(){
		$("form").sisyphus();
		
		var player1type = $("#new-game input[name='player1']:checked").val();
		var player2type = $("#new-game input[name='player2']:checked").val();
		
		if(player1type == 2)
			$("#new-game input[name='player1']").parent().parent().children('.level-select').show();
		else
			$("#new-game input[name='player1']").parent().parent().children('.level-select').hide();
		
		if(player2type == 2)
			$("#new-game input[name='player2']").parent().parent().children('.level-select').show();
		else
			$("#new-game input[name='player2']").parent().parent().children('.level-select').hide();
		
		// Affichage de la popup de création de partie
		if($.isEmptyObject(game.players)){			
			$('#new-game').modal({backdrop: 'static'});
		}
	}
	
	/**
	 * Lorsque le formulaire de création est submitté, on récupère ses infos et on crée une partie.
	 **/
	game.createGame = function(){
		game.roundBeforeNul = 50;
		game.roundWithoutWin = 0;
		game.defaultSleep = $("#new-game select[name='gameSpeed']").val();
		game.phase = 1;
		game.paused = 0;
		
		game.logs = [];
		game.history = [];
		
		/**
		 * Stocke l'état courant de la partie
		 * 0 : Placement d'un pion
		 * 1 : En attente d'un clic sur pion adverse, en vu de sa suppression
		 * 2 : En attente d'un clic sur emplacement vide, en vu du déplacement d'un pion
		 **/
		game.state = 0;
		
		game.beginTime = new Date().getTime();
		
		$("#board .white").removeClass("white");
		$("#board .black").removeClass("black");
		
		// Si création d'un BENCH
		if(game.bench && game.bench.player1level && game.bench.player2level){
			var player1level = game.bench.player1level;
			var player2level = game.bench.player2level;
			var player1type = player2type = 2;
			
			game.defaultSleep = 1;

		// Si création d'une partie normale
		} else {
			var player1level = $("#new-game input[name='player1level']:checked").val();
			var player2level = $("#new-game input[name='player2level']:checked").val();
			
			var player1type = $("#new-game input[name='player1']:checked").val();
			var player2type = $("#new-game input[name='player2']:checked").val();			
		}
		
		if(!game.players)
			game.players = {};
			
		game.players.player1 = {id: 1, type: player1type, color: 'black', piece: 9, placedPiece: 0, name: 'Joueur 1', strategies: []};
		game.players.player2 = {id: 2, type: player2type, color: 'white', piece: 9, placedPiece: 0, name: 'Joueur 2', strategies: []};
		
		if(game.players.player1.type == 2)
			game.players.player1.level = player1level;

		if(game.players.player2.type == 2)
			game.players.player2.level = player2level;
			
		$('#new-game').modal('hide');
		
		// Premier joueur choisi aléatoirement
		game.setCurrentPlayer(Math.floor((Math.random()*2)+1));
		
		if(game.player.type == 2){ // 2 = AI
			game.computer.play();
		}
		
		return true;
	}
	
	/**
	 * Lancement lors du submit du form new-bench
	 **/
	game.submitNewBench = function(){
		var player1level = $("#new-bench input[name='player1level']:checked").val();
		var player2level = $("#new-bench input[name='player2level']:checked").val();
		var roundNumber = $("#new-bench input[name='roundNumber']").val();
			
		$('#new-bench').modal('hide');
		
		game.createBench(player1level, player2level, roundNumber);
	}
	
	/**
	 * Création d'un bench
	 **/
	game.createBench = function(player1level, player2level, benchNumber){
		game.bench = {};
		game.bench.player1level = player1level;
		game.bench.player2level = player2level;
		game.bench.initNumber = benchNumber;
		game.bench.number = benchNumber;
		game.bench.begin = new Date().getTime();
		game.bench.totTime = 0;
		
		var getLevel = function(lvl){
			switch(parseInt(lvl)){
				case 1: 
					return "Novice"; 
					break;
				case 2: 
					return "Confirmé"; 
					break;
				case 3: 
					return "Expert"; 
					break;
			}
		}
		
		$("#player1level").html(getLevel(player1level));
		$("#player2level").html(getLevel(player2level));
		
		$(".phase1").remove();
		$(".phase2").remove();
		$(".history").hide();
		$(".benchResult").show();
		
		game.bench.number--;		
		game.createGame(player1level, player2level);		
	}
	
	/**
	 * Executuée lorsque la partie est terminée
	 **/
	game.endParty = function(winner){
		var message = (winner == 0) ? "Match nul" : winner.name + " a gagné !";
		
		if(!game.bench){
			$('#party-end .result').html(message);
			$('#party-end .elapse-time').html(game.formatTime(parseInt(Math.round((new Date().getTime() - game.beginTime) / 1000))));
			$('#party-end').modal({backdrop: 'static'});
		} else {
			if(winner == 0)
				$("#nulGame").html(parseInt($("#nulGame").html())+1);
			else
				$("#player"+ winner.id +"win").html(parseInt($("#player"+ winner.id +"win").html())+1);
			
			game.bench.totTime += (new Date().getTime() - game.beginTime);
			$("#benchAvTime").html(Math.round(game.bench.totTime/(game.bench.initNumber-game.bench.number)));
		}
		
		// Déclenche l'event
		game.phase = 0;
	}
	
	/**
	 * Permet de terminé le tour d'un joueur
	 **/
	game.endTurn = function(){
		
		if(game.paused == 1){
			return false;
		}
		
		game.roundWithoutWin++;
		if(game.roundWithoutWin >= game.roundBeforeNul){
			console.log("Limite de round sans victoire atteint");
			game.endParty(0);
		} else {

			game.setCurrentPlayer();
			
			if(game.phase == 1){
				// On vérife qu'il reste encore des piece aux joueurs, sinon on lance la game.phase 2.
				if(game.player.piece == 0 && game.enemy.piece == 0){
					$("#rules .phase1").hide();
					$("#rules .phase2").show();
					game.phase = 2;
				}
			} else {
				if(game.enemy.placedPiece == 2){
					game.endParty(game.player);
				}
				
				if(game.enemy.placedPiece == 3 && game.player.placedPiece == 3 && game.roundBeforeNul > 10){
					game.roundBeforeNul = 10;
				}
			}
			
			if(game.player.type == 2){
				/*if(game.bench)
					game.computer.play();
				else*/
					setTimeout(game.computer.play, game.defaultSleep);
			} else {
				if(game.player.placedPiece > 1 && !game.computer.findRandomMove()){
					game.endParty(game.enemy);
				}
			}
		}
	}
	
	/**
	 * Return "true" si une ligne forme un moulin complet
	 **/
	game.isMill = function(line){
		return ($('#piece' + game.mills[line].piece[0]).hasClass(game.player.color) &&
			    $('#piece' + game.mills[line].piece[1]).hasClass(game.player.color) &&
			    $('#piece' + game.mills[line].piece[2]).hasClass(game.player.color)) || 
			   ($('#piece' + game.mills[line].piece[0]).hasClass(game.enemy.color) &&
			    $('#piece' + game.mills[line].piece[1]).hasClass(game.enemy.color) &&
			    $('#piece' + game.mills[line].piece[2]).hasClass(game.enemy.color));
	}
	
	/**
	 * Permet le changement de joueur courant
	 * Si pas de paramètre, on effectue un changemnt de joueur classique
	 **/
	game.setCurrentPlayer = function(player){
		if(!game.player)
			game.player = {};

		if(!game.enemy)
			game.enemy = {};
			
		if(!player && game.player.id === 1){
			player = 2;
		} else if(!player && game.player.id === 2){
			player = 1;
		}
		
		if(player == 1){
			game.player = game.players.player1;
			game.enemy = game.players.player2;
		} else if(player == 2) {
			game.player = game.players.player2;
			game.enemy = game.players.player1;
		} else {
			
			var oldPlayer = game.player;
			var oldEnemy = game.enemy;

			(function(oldPlayer, oldEnemy){
				game.player = oldEnemy;
				game.enemy = oldPlayer;
			})(oldPlayer, oldEnemy);
			
			delete oldPlayer;
			delete oldEnemy;
		}
		
		var type = (game.player.type == 2) ? " (IA level "+ game.player.level +")" : "";
		$("#curPlayer").html(game.player.name + type);
	}
	
	game.formatTime = function(secs){
		var hours = Math.floor(secs / (60 * 60));
   
		var divisor_for_minutes = secs % (60 * 60);
		var minutes = Math.floor(divisor_for_minutes / 60);
	 
		var divisor_for_seconds = divisor_for_minutes % 60;
		var seconds = Math.ceil(divisor_for_seconds);
	   
		var data = "";
		
		if(hours > 0)
			data += hours + "h ";

		if(minutes > 0)
			data += minutes + "m ";

		if(seconds > 0)
			data += seconds + "s";
			
		return data;
	}
	
	/**
	 * Fonction permettant de repasser sur chaque combinaison, 
	 * afin de vérifier si une nouvelle ligne n'a pas été complété.
	 **/
	game.millCheck = function(){
		var isNew = false;
		for(var i = 0; i < 16; i++){
			
			if(game.isMill(i)){
				if(game.mills[i].check == false){
					game.mills[i].check = isNew = true;
				}
			} else {
				game.mills[i].check = false;
			}
		}

		return isNew;
	}
	
	/**
	 * Permet de savoir si un pion fait parti d'un moulin
	 **/
	game.checkIfPieceIsInMill = function(domElement){
		var pieceID = parseInt($(domElement).attr('id').replace(new RegExp("piece"), ""));
		
		for(var i = 0; i < 16; i++){
			if(game.isMill(i) && (pieceID == game.mills[i].piece[0] || pieceID == game.mills[i].piece[1] || pieceID == game.mills[i].piece[2])){
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Permet de savoir si il existe un pion en dehors d'un moulin
	 **/
	game.checkIfOnePieceExistOutOfMill = function(){
		var enemyPieces = $("#board .piece."+ game.enemy.color);
		
		for(var i = 0; i < enemyPieces.length; i++){
			if(!game.checkIfPieceIsInMill(enemyPieces[i])){
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Tool permettant de connaitre :
	 * - nombre de piece du player sur une ligne
	 * - nombre de piece du computer sur une ligne
	 * - place disponible sur une ligne
	 **/
	game.getPieceOnLine = function(line){
		var playerCount = 0, enemyCount = 0;
		var available = [];
		
		for(var i = 0; i < 3; i++){
			if($('#piece' + game.mills[line].piece[i]).hasClass(game.enemy.color)){
				enemyCount++;
			} else if($('#piece' + game.mills[line].piece[i]).hasClass(game.player.color)){
				playerCount++;
			} else {
				available.push($('#piece' + game.mills[line].piece[i]));
			}
		}
		
		return {enemyCount: enemyCount, playerCount: playerCount, available: available};
	}
	
	/**
	 * Permet la suppression d'un pion placé sur le plateau de jeu
	 **/
	game.removePiece = function(target){
		if(!target.hasClass(game.enemy.color)){
			alert('Merci de cliquer sur un des pions de votre adversaire !');
		} else {
			if(game.checkIfPieceIsInMill(target) && game.checkIfOnePieceExistOutOfMill()){
				alert('Ce pion fait parti d\'un moulin, vous ne pouvez pas le supprimer.');
			} else {
				// On enlève le pion de l'adversaire du plateau de jeu
				$(target).removeClass(game.enemy.color);
				game.enemy.placedPiece--;
				
				game.roundWithoutWin = 0;
				
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Permet le placement d'un pion sur le plateau de jeu
	 **/
	game.placePiece = function(target){
		if(game.player.piece === 0){
			game.endTurn();
		} else if(!game.isFree(target)){

		} else {
			target.addClass(game.player.color);
		
			if(game.phase === 1){
				game.player.piece--;
				game.player.placedPiece++;
				
				if(!game.benchmark)
					$("#report ." + game.player.color).last().remove();
				
				game.history.push({phase: 1, target: target});
			}
			
			return true;
		}
		
		return false;
	}
	
	/**
	 * Permet le déplacement d'un pion
	 **/
	game.movePiece = function(startingPoint, arrivalPoint){
		var startingPointID = parseInt(startingPoint.attr('id').replace(new RegExp("piece"), ""));
		var arrivalPointID = parseInt(arrivalPoint.attr('id').replace(new RegExp("piece"), ""));
					
		if(game.movement[startingPointID].indexOf(arrivalPointID) != -1 || game.player.placedPiece <= 3){			
			// Est-ce que l'emplacement est libre ?
			if(game.isFree(arrivalPoint)){
				
				// On déplace le pion
				startingPoint.removeClass(game.player.color);
				arrivalPoint.addClass(game.player.color);
				
				return true;
			}
		}
		
		return false;
	}
	
	/**
	 * Permet de savoir si un emplacement est libe ou non
	 * return : 'true' si l'emplacement est libre
	 *			'false' si il ne l'est pas
	 **/
	game.isFree = function(location){
		return (!location.hasClass(game.enemy.color) && !location.hasClass(game.player.color));
	}
		
	game.displayLogs = function(msg){
		var data = "";
		
		for(var i = 0; i < game.logs.length; i++){
			data += "<p>"+ game.logs[i] +"</p>";
		}
		
		$("#logs").html(data);
	}
	
	game.setPaused = function(){
		$(".history .icon-pause").hide();
		$(".history .icon-play").show();
		//$(".history .icon-step-backward").show();
		game.paused = 1;
	}
	
	game.setPlay = function(){
		$(".history .icon-pause").show();
		$(".history .icon-play").hide();
		//$(".history .icon-step-backward").hide();
		game.paused = 0;
		
		if(game.player.type == 2)
			game.endTurn();
	}
	
	game.stepBackward = function(){
		var lastMove = game.history[game.history.length-1];

		if(lastMove.phase == 1){
			
		}
	}
	
})();