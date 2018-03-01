const model = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");


/**
 * Muestra la ayuda
 */
exports.helpCmd = rl => {
    log("  Commands:",'blue');
    console.log("    h|help - Muestra esta ayuda");
    console.log("    list - Lista los quizzes existentes");
    console.log("    show <id> - Muestra la pregunta y la respuesta indicada");
    console.log("    add - Añade una nueva pregunta interactivamente");
    console.log("    delete <id> - Borra la pregunta indicada");
    console.log("    edit <id> - Edita la pregunta indicada");
    console.log("    test <id> - Prueba la pregunta indicada");
    console.log("    p|play - Inicia el quiz en orden aleatorio");
    console.log("    credits - Muestra los créditos del quiz");
    console.log("    q|quit - Sale del programa");
    rl.prompt();
};

/**
 * Lista los quizzes existentes
 */
exports.listCmd = rl => {

	model.getAll().forEach((quiz, id) => {
		log(`  [${colorize(id, 'blue')}]: ${quiz.question}`);
	});

    rl.prompt();

};

/**
 * Muestra la pregunta y la respuesta indicada
 *
 * @param id Clave de la pregunta a mostrar
 */
exports.showCmd = (rl, id) => {
    
    if(typeof id === "undefined"){
    	//errorlog(`Falta el parámetro id`);
	//peligroso
    	model.getAll().forEach((quiz, id) => {
			log(`  [${colorize(id, 'blue')}]: ${quiz.question}`);
		});
    }
    else{
    	try{
    		const quiz = model.getByIndex(id);
    		log(` [${colorize(id, 'blue')}]: ${quiz.question} ${colorize('=>', 'blue')} ${quiz.answer}`);
    	}
    	catch(error){
    		errorlog(error.message);
    	}
    }
    rl.prompt();

};

/**
 * Añade una nueva pregunta interactivamente
 */
exports.addCmd = rl => {
    
    rl.question(colorize('  Introduzca una pregunta: ', 'blue'), question => {
    	rl.question(colorize('  Introduzca la respuesta: ', 'blue'), answer => {
    		model.add(question, answer);
    		log(`${colorize('  Se ha añadido', 'green')}: ${question} ${colorize('=>', 'blue')} ${answer}`);
    		rl.prompt();
    	});
    });
};

/**
 * Borra la pregunta indicada
 *
 * @param id Clave de la pregunta a eliminar
 */
exports.deleteCmd = (rl, id) => {
    
    if(typeof id === "undefined"){
    	errorlog(`Falta el parámetro id`);
    }
    else{
    	//Peligroso
    	rl.question(colorize('  ¿Está seguro de que desea borrar la pregunta? [y/n]: ', 'blue'), confirm => {
    		if(confirm==="y"){
		    	try{
		    		model.deleteByIndex(id);
			    	log(`  ${colorize("La pregunta", 'green')} [${colorize(id, 'blue')}] ${colorize("se ha borrado", 'green')}`);
		    	}
		    	catch(error){
		    		errorlog(error.message);
		    		rl.prompt();
		    	}
		    }
	    	rl.prompt();
		});
    }
};

/**
 * Edita la pregunta indicada
 *
 * @param id Clave de la pregunta a editar
 */
exports.editCmd = (rl, id) => {
    
    if(typeof id === "undefined"){
    	errorlog(`Falta el parámetro id`);
    	rl.prompt();
    }
    else{
		try{
			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    		rl.question(colorize('  Introduzca una pregunta: ', 'blue'), question => {

    			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
				rl.question(colorize('  Introduzca una respuesta: ', 'blue'), answer => {

	    			model.update(id, question, answer);
		    		log(`${colorize('  Se ha cambiado la pregunta', 'green')} [${colorize(id, 'blue')}] ${colorize('por', 'green')} ${question} ${colorize('=>', 'blue')} ${answer}`);
		    		rl.prompt();

		    	});

		    });
    	}
    	catch(error){
    		errorlog(error.message);
    		rl.prompt();
    	}
    }

};

/**
 * Prueba la pregunta indicada, a la que debemos responder
 *
 * @param id Clave de la pregunta a probar
 */
exports.testCmd = (rl, id) => {

    if(typeof id === "undefined"){
    	errorlog(`Falta el parámetro id`);
    	rl.prompt();
    }
    else{
	try{
		const quiz = model.getByIndex(id);
		rl.question(`  ${colorize(quiz.question,'blue')} `, ans => {
			if(ans.trim().toLowerCase()===quiz.answer.toLowerCase()){
				log('  Su respuesta es correcta', 'green');
				//log('  Su respuesta es...');
				//process.stdout.isTTY && setTimeout(() => {
				//	biglog('Correcta :)', 'green');
				//	rl.prompt();
				//}, 1000);
				rl.prompt();
			}
			else{
				log('  Su respuesta es incorrecta', 'red');
				//log('  Su respuesta es...');
				//process.stdout.isTTY && setTimeout(() => {
				//	biglog('Incorrecta :(', 'red');
				//	rl.prompt();
				//}, 1000);
				rl.prompt();
			}
		});
    	}
    	catch(error){
    		errorlog(error.message);
    		rl.prompt();
    	}
    }

};

/**
 * Inicia el quiz, realiza todas las preguntas en orden aleatorio
 */
exports.playCmd = rl => {

	let score = 0;
	let still = [];
	for (var i = 0; i < model.count(); i++) {
   		still.push(i);
	}

	const playOne = () => {
		if(still.length === 0){

			log('  No hay más preguntas','blue');
			biglog(`¡ Has acertado ${score} de ${model.count()} ! :D`, 'green');
			rl.prompt();

		}
		else{

			let r = Math.round(Math.random() * (still.length) - 0.5);

			const quiz = model.getByIndex(still[r]);

			rl.question(`  ${colorize(quiz.question, 'blue')} `, ans => {

				still.splice(r, 1);

				if(ans.trim().toLowerCase() === quiz.answer.toLowerCase()){
					log(`Respuestas correctas: ${++score}`, 'green');
					playOne();
				}
				else{
					log('  Respuesta incorrecta...', 'red');
					biglog(`¡ Has acertado ${score} de ${model.count()} ! :|`, 'blue');
					break;
					rl.prompt();
				}

			});

		}
	};

	playOne();

}


/**
 * Muestra los créditos del quiz
 */
exports.creditsCmd = rl => {
    log('  Autor de la práctica:', 'blue');
    log('  Lucas Sagué Leblic','green');
    rl.prompt();
};

/**
 * Sale del programa
 */
exports.quitCmd = rl => {
    rl.close();
};
