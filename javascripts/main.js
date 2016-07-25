"use strict";
Vue.filter('✖⚪', function(n){ return (n == 1 ? '✖' : (n == 2 ? '⚪' : ''))});

var app = new Vue({
	el: '#app',
	data: {
		turns: [],
		net: new brain.NeuralNetwork(),
		learning: false,
		learning_arr: [0, 0, 0, 0, 0, 0, 0, 0, 0],
		ai:[NaN, 1, 1]
	}, computed: {
		fld: function(){ return this.turns.reduce(function(arr, t, i){ arr[t] = 1 + (i&1); return arr; }, [0, 0, 0, 0, 0, 0, 0, 0, 0]); },
		turn: function(){ return this.turns.reduce(function(pv, cv, i){ return i; }, 0); },
		player: function(){ return this.turns.reduce(function(pv, cv, i){ return 2 - (i&1); }, 1); },
		gameover: function(){
			var fld = this.fld;
			
			if(fld[4] != 0 && fld[4] == fld[3] && fld[3] == fld[5]
			|| fld[4] != 0 && fld[4] == fld[1] && fld[1] == fld[7]
			|| fld[4] != 0 && fld[4] == fld[0] && fld[0] == fld[8]
			|| fld[4] != 0 && fld[4] == fld[2] && fld[2] == fld[6])
			return {win: fld[4], lose: 3 - fld[4]}
			
			if(fld[0] != 0 && fld[0] == fld[1] && fld[1] == fld[2]
			|| fld[0] != 0 && fld[0] == fld[3] && fld[3] == fld[6])
			return {win: fld[0], lose: 3 - fld[0]}
			
			if(fld[8] != 0 && fld[8] == fld[6] && fld[6] == fld[7]
			|| fld[8] != 0 && fld[8] == fld[2] && fld[2] == fld[5])
			return {win: fld[8], lose: 3 - fld[8]}
			
			if(this.turn >= 8) return {win: 0, lose: 0}; else return false;
		}
	}, methods: {
		clear: function(){ this.turns.splice(0, 9); for(var i = 0; i < 9; i++) this.clr(i, null); },
		clr: function(n, value){
			if(!!value || value === 0 && this.player == 2) value == 1.0 - value;
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
				], {iterations: 1E5, errorThresh: 1E-4, learningRate: 0.3});
				
			} else {
				this.learning = true;
				fld = fld.map(function(n){ return (n == 1 ? 0.0 : (n == 2 ? 1.0 : 0.5)) });
				
				for(var i = 0; i < 9; i++){
					if(fld[i] == 0.0) result[i] = 0.00;
					else if(fld[i] == 1.0) result[i] = 1.00;
					else if(result[i] > 0.875 && result[i] <= 1.000) result[i] = 1.00;
					else if(result[i] > 0.625 && result[i] <= 0.875) result[i] = 0.75;
					else if(result[i] > 0.375 && result[i] <= 0.625) result[i] = 0.50;
					else if(result[i] > 0.125 && result[i] <= 0.375) result[i] = 0.25;
					else if(result[i] >= 0.00 && result[i] <= 0.125) result[i] = 0.00;
					
					this.clr(i, result[i]);
					this.learning_arr[i] = result[i];
				}
			}
		},
		calc: function(){
			
			var player = this.player, result, sum, random, net = this.net, fld = this.fld;
			
			//заменяем значения клеток для нейросети
			fld = fld.map(function(n){ return (n == 1 ? 0.0 : (n == 2 ? 1.0 : 0.5)) });
			
			//получаем разброс вероятностей для каждой клетки
			result = app.net.run(fld);
			
			for(var i = 0; i < 9; i++){
				
				if(result[i] > 0.875 && result[i] <= 1.000) result[i] = 1.00;
				else if(result[i] > 0.625 && result[i] <= 0.875) result[i] = 0.75;
				else if(result[i] > 0.375 && result[i] <= 0.625) result[i] = 0.50;
				else if(result[i] > 0.125 && result[i] <= 0.375) result[i] = 0.25;
				else if(result[i] >= 0.00 && result[i] <= 0.125) result[i] = 0.00;
				
				this.clr(i, result[i]);
				
				if(fld[i] == 0.0) result[i] = 0.00;
				else if(fld[i] == 1.0) result[i] = 1.00;
			}
			
			//вычисляем сумму, а затем вес каждой клетки результата по отношению к 255
			sum = 255 / result.reduce(function(sum, cv, i){ return sum + (fld[i] == 0.5 ? (player == 1 ? cv : 1.0 - cv) : 0.0); }, 0.0);
			
			//накапливаем сумму произведений веса на вероятность в клетке, назначаем накопленное в клетку результата
			result.reduce(function(acc, cv, i, arr){ acc += sum * (fld[i] == 0.5 ? (player == 1 ? cv : 1.0 - cv) : 0.0); arr[i] = acc&255; return acc; }, 0);
			
			//генерируем случайное число от 0 до 255
			random = new Uint8Array(1); crypto.getRandomValues(random); random = random[0];
			//alert(random + ' in ' + JSON.stringify(result));
			
			//находим первую клетку результата, которое будет не меньше случайного числа
			random = result.reduce(function(pv, cv, i){ if(pv == -1 && cv > random && fld[i] == 0.5) return i; else return pv; }, -1);
			if(random < 0 || random > 8) random = 4;
			
			//потом игрок кликает в клетку
			alert(random);
			//this.clk(random);
		},
		clk: function(num){
			var gameover, fld, player;
			if(this.learning){
				fld = this.fld, player = this.player;
				this.learning_arr[num] = ((this.learning_arr[num] * 100 + 25) % 101) / 100;
				this.clr(num, this.learning_arr[num]);
			} else {
				gameover = this.gameover;
				if(gameover) {
					alert('Игра закончена, победил ' + gameover.win + ', проиграл ' + gameover.lose);
					this.clear();
				} else if(num >= 0 && num < 9 && !this.turns.some(function(n){ return n == num; })){
					this.turns.push(num);
				}
			}
		}
	}
});

console.log(app.net.train([
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.75, 0.25, 0.75, 0.25, 1.00, 0.25, 0.75, 0.25, 0.75]}
], {iterations: 10000, errorThresh: 0.001, learningRate: 0.3}));