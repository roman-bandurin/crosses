"use strict";

var app = new Vue({
	el: '#app',
	data: {
		turns: [],
		net: new brain.NeuralNetwork(),
		learning: false,
		learning_arr: [0, 0, 0, 0, 0, 0, 0, 0, 0],
		rand_arr: '',
		ai:[NaN, 1, 1]
	}, computed: {
		fld: function(){ return this.turns.reduce(function(arr, t, i){
			arr[t] = +(i&1); return arr;
		}, [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]); },
		turn: function(){ return this.turns.reduce(function(pv, cv, i){ return i; }, 0); },
		player: function(){ return this.turns.reduce(function(pv, cv, i){ return +(~i&1); }, 0.0); },
		gameover: function(){
			var fld = this.fld;
			
			if(fld[4] != 0.5 && fld[4] == fld[3] && fld[3] == fld[5]
			|| fld[4] != 0.5 && fld[4] == fld[1] && fld[1] == fld[7]
			|| fld[4] != 0.5 && fld[4] == fld[0] && fld[0] == fld[8]
			|| fld[4] != 0.5 && fld[4] == fld[2] && fld[2] == fld[6])
			return {win: fld[4], lose: 1.0 - fld[4]}
			
			if(fld[0] != 0.5 && fld[0] == fld[1] && fld[1] == fld[2]
			|| fld[0] != 0.5 && fld[0] == fld[3] && fld[3] == fld[6])
			return {win: fld[0], lose: 1.0 - fld[0]}
			
			if(fld[8] != 0.5 && fld[8] == fld[6] && fld[6] == fld[7]
			|| fld[8] != 0.5 && fld[8] == fld[2] && fld[2] == fld[5])
			return {win: fld[8], lose: 1.0 - fld[8]}
			
			if(this.turn >= 8) return {win: 0, lose: 0}; else return false;
		}
	}, methods: {
		out: function(n){ return (n == 0.0 ? '✖' : (n == 1.0 ? '⚪' : ''))},
		clear: function(){ this.turns.splice(0, 9); for(var i = 0; i < 9; i++) this.clr(i, null); },
		clr: function(n, value){
			if((!!value || value === 0) && this.player == 1.0) value == 1.0 - value;
			document.querySelector('#app table tr:nth-child(' + ((n/3+1)>>0) + ') td:nth-child(' + ((n%3+1)>>0) + ')').style.background
				= (!value && value !== 0 ? 'inherit' : 'linear-gradient(to right, #dcedc8 '+((value*1000-1000)>>0)+'%,#ffccbc '+((1000*value)>>0)+'%)');
		},
		learn: function(){
			var player = this.player, fld = this.fld, la = this.learning_arr, result;
			if(this.learning){
				this.learning = false;
				app.net.train([{input:fld, output:la},
					{input:[fld[6], fld[3], fld[0], fld[7], fld[4], fld[1], fld[8], fld[5], fld[2]],
					output:[la[6],  la[3],  la[0],  la[7],  la[4],  la[1],  la[8],  la[5],  la[2]]},
					{input:[fld[8], fld[7], fld[6], fld[5], fld[4], fld[3], fld[2], fld[1], fld[0]],
					output:[la[8],  la[7],  la[6],  la[5],  la[4],  la[3],  la[2],  la[1],  la[0]]},
					{input:[fld[2], fld[5], fld[8], fld[1], fld[4], fld[7], fld[0], fld[3], fld[6]],
					output:[la[2],  la[5],  la[8],  la[1],  la[4],  la[7],  la[0],  la[3],  la[6]]}
				], {iterations: 1E5, errorThresh: 5E-3, learningRate: 0.3});
				
			} else {
				this.learning = true;
				result = this.net.run(fld);
				
				for(var i = 0; i < 9; i++){
					if(fld[i] == 0.0) result[i] = 0.50;
					else if(fld[i] == 1.0) result[i] = 0.50;
					else if(result[i] > 0.875) result[i] = 1.00;
					else if(result[i] > 0.625 && result[i] <= 0.875) result[i] = 0.75;
					else if(result[i] > 0.375 && result[i] <= 0.625) result[i] = 0.50;
					else if(result[i] > 0.125 && result[i] <= 0.375) result[i] = 0.25;
					else if(result[i] <= 0.125) result[i] = 0.00;
					
					this.clr(i, result[i]);
					la[i] = result[i];
				}
			}
		},
		calc: function(){
			
			var player = this.player, result, sum, random, net = this.net, fld = this.fld;
			
			//получаем разброс вероятностей для каждой клетки
			result = app.net.run(fld);
			
			for(var i = 0; i < 9; i++){
				
				if(result[i] > 0.875) result[i] = 1.00;
				else if(result[i] > 0.625 && result[i] <= 0.875) result[i] = 0.75;
				else if(result[i] > 0.375 && result[i] <= 0.625) result[i] = 0.50;
				else if(result[i] > 0.125 && result[i] <= 0.375) result[i] = 0.25;
				else if(result[i] <= 0.125) result[i] = 0.00;
				
				this.clr(i, result[i]);
				
				if(fld[i] == 0.0) result[i] = 0.00;
				else if(fld[i] == 1.0) result[i] = 0.00;
			}
			
			//вычисляем сумму, а затем вес каждой клетки результата по отношению к 255
			//sum = result.reduce(function(sum, cv, i){ cv = (fld[i] == 0.5 ? cv : 0.0); return sum + cv; }, 0.0);
			
			var obj = this.turns.reduce(function(obj, i){ return obj[i]; }, obj2), sum = 0;
			result = [0, 0, 0, 0, 0, 0, 0, 0, 0];
			for(var i = 0; i < 9; i++) if(obj[i] != 0 && fld[i] == 0.5) { result[i] = (obj[i] != 0 ? obj[i][player == 0.0 ? 9 : 10] / obj[i][11] : 0); sum = sum + result[i]; }
			for(var i = 0; i < 9; i++) { this.clr(i, result[i] / sum); this.learning_arr[i] = result[i] / sum; }
			sum = 255 / sum;
			//накапливаем сумму произведений веса на вероятность в клетке, назначаем накопленное в клетку результата
			//result.reduce(function(acc, cv, i, arr){ cv = (fld[i] == 0.5 ? cv : 0.0); acc += sum * cv; arr[i] = (!!cv ? acc&255 : 0); return acc; }, 0);
			result = [0, 0, 0, 0, 0, 0, 0, 0, 0];
			result.reduce(function(acc, cv, i, arr){ cv = (obj[i] != 0 && fld[i] == 0.5 ? obj[i][player == 0.0 ? 9 : 10] / obj[i][11] : 0); acc += cv * sum; arr[i] = (!!cv ? acc&255 : 0); return acc; }, 0);
			
			//генерируем случайное число от 0 до 255
			random = new Uint8Array(1); crypto.getRandomValues(random); random = random[0];
			//this.rand_arr = random + ' in ' + JSON.stringify(result);
			
			//находим первую клетку результата, которое будет не меньше случайного числа
			random = result.reduce(function(pv, cv, i){ if(pv == -1 && random < cv && fld[i] == 0.5) return i; else return pv; }, -1);
			if(random < 0 || random > 8) random = 4;
			
			//потом игрок кликает в клетку
			//this.rand_arr = this.rand_arr + ', выпало ' + random;
			//this.clk(random);
			this.rand_arr = obj[9] + ' хода ✖ победные, '+ obj[10] + ' хода ⚪ победные, всего ' + obj[11] + ' ходов';
		},
		clk: function(num){
			var gameover, fld, player, la;
			if(this.learning){
				fld = this.fld, player = this.player, la = this.learning_arr;
				la[num] = (la[num] * 4 + 1) % 5 / 4;
				
				if(la[num] > 0.875) la[num] = 1.00;
				else if(la[num] > 0.625 && la[num] <= 0.875) la[num] = 0.75;
				else if(la[num] > 0.375 && la[num] <= 0.625) la[num] = 0.50;
				else if(la[num] > 0.125 && la[num] <= 0.375) la[num] = 0.25;
				else if(la[num] <= 0.125) la[num] = 0.00;
				
				this.clr(num, la[num]);
			} else {
				gameover = this.gameover;
				if(gameover) {
					alert('Игра закончена, победил ' + gameover.win + ', проиграл ' + gameover.lose);
					this.clear();
				} else if(num >= 0 && num < 9 && !this.turns.some(function(n){ return n == num; })){
					this.turns.push(num);
				}
				for(var i = 0; i < 9; i++) this.clr(i, null);
			}
		}
	}
});

console.log(app.net.train([
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[1, 0, 1, 0, 1, 0, 1, 0, 1]}
], {iterations: 1E5, errorThresh: 5E-3, learningRate: 0.3}));