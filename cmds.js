const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const Sequelize = require('sequelize');


/**
 * Muestra la ayuda
 */
exports.helpCmd = rl => {
    log("  Commands:",'blue');
    log("    h|help - Muestra esta ayuda");
    log("    list - Lista los quizzes existentes");
    log("    show <id> - Muestra la pregunta y la respuesta indicada");
    log("    add - Añade una nueva pregunta interactivamente");
    log("    delete <id> - Borra la pregunta indicada");
    log("    edit <id> - Edita la pregunta indicada");
    log("    test <id> - Prueba la pregunta indicada");
    log("    p|play - Inicia el quiz en orden aleatorio");
    log("    credits - Muestra los créditos del quiz");
    log("    q|quit - Sale del programa");
    rl.prompt();
};

/**
 * Lista los quizzes existentes
 */
exports.listCmd = rl => {

    models.quiz.findAll().each(quiz => {
    		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    }).catch(error => {
    	errorlog(error.message);
    }).then(() => {
    	rl.prompt();
    });

};

const validateId = id => {

	return new Sequelize.Promise((resolve, reject) => {
		if(typeof id === "undefined") {
			reject(new Error(`Falta el parámetro <id>`));
		}
		else{
			id = parseInt(id);
			if(Number.isNaN(id)){
				reject(new Error(`El valor del parámetro <id> no es un número`))
			}
			else{
				resolve(id);
			}
		}
	});
};

/**
 * Muestra la pregunta y la respuesta indicada
 *
 * @param id Clave de la pregunta a mostrar
 */
exports.showCmd = (rl, id) => {
    
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
    	if(!quiz){
    		throw new Error(`No existe un quiz asociado al id=${id}`);
    	}
    	log(` [${colorize(quiz.id, 'blue')}]: ${quiz.question} ${colorize('=>', 'blue')} ${quiz.answer}`);
    })
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });

};

const makeQuestion = (rl, text) => {

	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'blue'), answer => {
			resolve(answer.trim());
		});
	});

};

/**
 * Añade una nueva pregunta interactivamente
 */
exports.addCmd = rl => {
    
    makeQuestion(rl, ' Introduzca una pregunta: ')
    .then(q => {
    	return makeQuestion(rl, ' Introduzca una respuesta: ')
    	.then(a => {
    		return {question: q, answer: a};
    	});
    })
    .then(quiz => {
    	return models.quiz.create(quiz);
    })
    .then((quiz) => {
    	log(` ${colorize('Se ha añadido', 'blue')}: ${quiz.question} ${colorize('=>', 'blue')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
    	errorlog('El quiz es erróneo:');
    	error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });

};

/**
 * Borra la pregunta indicada
 *
 * @param id Clave de la pregunta a eliminar
 */
exports.deleteCmd = (rl, id) => {
    
    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });

};

/**
 * Edita la pregunta indicada
 *
 * @param id Clave de la pregunta a editar
 */
exports.editCmd = (rl, id) => {
    
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
    	if(!quiz){
    		throw new Error(`No existe un quiz asociado al id=${id}`);
    	}
    	process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    	return makeQuestion(rl, ' Introduzca la pregunta: ')
    	.then(q => {
    		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
    		return makeQuestion(rl, ' Introduzca la respuesta: ')
    		.then(a => {
    			quiz.question = q;
    			quiz.answer = a;
    			return quiz;
    		});
    	});
    })
    .then(quiz => {
    	return quiz.save();
    })
    .then(quiz => {
    	log(` Se ha cambiado el quiz ${colorize(quiz.id, 'blue')} por: ${quiz.question} ${colorize('=>', 'blue')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
    	errorlog('El quiz es erróneo:');
    	error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};

/**
 * Prueba la pregunta indicada, a la que debemos responder
 *
 * @param id Clave de la pregunta a probar
 */
exports.testCmd = (rl, id) => {
    
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
    	if(!quiz){
    		throw new Error(`No existe un quiz asociado al id=${id}`);
    	}
    	return makeQuestion(rl, `  ${colorize(quiz.question, 'blue')}: `)
    	.then(ans => {
    		if(ans.trim().toLowerCase() === quiz.answer.toLowerCase()){
    			log('    ¡Respuesta correcta!', 'green');
    			biglog('Correcto : )','green');
    		}
    		else{
    			log('    Respuesta incorrecta...', 'red');
    			biglog('Incorrecto :´ (','red')
    		}
		});
    	////
    })
    .then(() => {
    	rl.prompt();
    })
    .catch(Sequelize.ValidationError, error => {
    	errorlog('El quiz es erróneo:');
    	error.errors.forEach(({message}) => errorlog(message));
    	rl.prompt();
    })
    .catch(error => {
    	errorlog(error.message);
    	rl.prompt();
    });

};

/**
 * Inicia el quiz, realiza todas las preguntas en orden aleatorio
 */
exports.playCmd = rl => {

	let score = 0;
	let still = [];

	let i = 1;
	models.quiz.findAll().each(quiz => {
		still.push(quiz.id);
		let thereWere = still.length;
	})
	.then(() => {
		playOne();
	});

	const playOne = () => {
		if(still.length === 0){

			log('No hay nada más que preguntar.');
			log(`Fin del juego. Aciertos: ${score}`);
			biglog(score, 'magenta');
			rl.prompt();

		}
		else{

			let r = Math.round(Math.random() * (still.length) - 0.5);

			validateId(r)
			.then(r => models.quiz.findById(still[r]))
			.then(quiz => {
				if(!quiz){
					throw new Error(`No existe un quiz asociado al id=${r}`);
				}
				return makeQuestion(rl, `  ${colorize(quiz.question, 'blue')}: `)
				.then(ans => {
					still.splice(r, 1);
					if(ans.trim().toLowerCase() === quiz.answer.toLowerCase()){
						log(`CORRECTO - Lleva ${++score} aciertos.`);
						playOne();
					}
					else{
						log('Fin del juego. Aciertos: ${score}');
						log('INCORRECTO.');
						biglog(`${score}`, 'blue')
					}
				});
			})
			.catch(Sequelize.ValidationError, error => {
				errorlog('El quiz es erróneo:');
				error.errors.forEach(({message}) => errorlog(message));
				rl.prompt();
			})
			.catch(error => {
				errorlog(error.message);
				rl.prompt();
			})
			.then(() => {
				rl.prompt();
			});
		}
	};
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
