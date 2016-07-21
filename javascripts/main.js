"use strict";
Vue.filter('✖⚪', function(n){ return (n == 1 ? '✖' : (n == 2 ? '⚪' : ''))});

var app = new Vue({
	el: '#app',
	data: {
		turns: [],
		net: new brain.NeuralNetwork(),
		ai:[NaN, 1, 1]
	}, computed: {
		fld: function(){ return this.turns.reduce(function(arr, t, i){ arr[t] = 1 + (i&1); return arr; }, [0, 0, 0, 0, 0, 0, 0, 0, 0]); },
		turn: function(){ return this.turns.reduce(function(pv, cv, i){ return i; }, 0); },
		player: function(){ return this.turns.reduce(function(pv, cv, i){ return 2 - (i&1); }, 1); },
		gameover: function(){
			var fld = this.fld;
			
			if(fld[4] != 0 && fld[3] == fld[4] && fld[4] == fld[5]
			|| fld[4] != 0 && fld[1] == fld[4] && fld[4] == fld[7]
			|| fld[4] != 0 && fld[0] == fld[4] && fld[4] == fld[8]
			|| fld[4] != 0 && fld[2] == fld[4] && fld[4] == fld[6])
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
		clear: function(){ this.turns.splice(0, 9); },
		clr: function(n, value){
			document.querySelector('#app table tr:nth-child(' + ((n/3+1)>>0) + ') td:nth-child(' + ((n%3+1)>>0) + ')').style.background
				= 'linear-gradient(to right, #dcedc8 '+(value*1000-1000)+'%,#ffccbc '+(1000*value)+'%)';
		},
		calc: function(){
			
			var player = this.player, result, sum, random, net = this.net, fld = this.fld;
			
			//заменяем значения клеток для нейросети
			fld = fld.map(function(n){ return (n == 1 ? 0.0 : (n == 2 ? 1.0 : 0.5)) });
			
			//получаем разброс вероятностей для каждой клетки
			result = app.net.run(fld);
			
			//вычисляем сумму, а затем вес каждой клетки результата по отношению к 255
			sum = 255 / result.reduce(function(sum, cv, i){ return sum + (fld[i] == 0.5 ? (player == 1 ? cv : 1.0 - cv) : 0.0); }, 0.0);
			
			//накапливаем сумму произведений веса на вероятность в клетке, назначаем накопленное в клетку результата
			result.reduce(function(acc, cv, i, arr){ acc += sum * (fld[i] == 0.5 ? (player == 1 ? cv : 1.0 - cv) : 0.0); arr[i] = acc&255; return acc; }, 0);
			
			//генерируем случайное число от 0 до 255
			random = new Uint8Array(1); crypto.getRandomValues(random); random = random[0];
			//alert(random + ' in ' + JSON.stringify(result));
			
			//находим первую клетку результата, которое будет не меньше случайного числа
			//random = result.reduce(function(pv, cv, i){ if(pv == -1 && cv > random && fld[i] == 0.5) return i; else return pv; }, -1);
			random = (random / 28)>>0;
			if(random < 0 || random > 8) random = 4;
			
			//спрашиваем, сначала что вариант больше победный и проигрышный(0 или 1), затем сильно ли он такой(0.25, 0.75)
			if(confirm('Сильный ход (' + ((random/3+1)>>0) + ' строка, ' + ((random%3+1)>>0) + ' столбец) для игрока ' + player + '?'))
				if(confirm('победный?')) sum = 1.0; else sum = 0.75;
			else 
				if(confirm('может хоть средний?')) sum = 0.25; else sum = 0.00;
			if(player == 2) sum = 1.0 - sum;
			
			//подготавливаем правило
			result = app.net.run(fld);
			for(var i = 0; i < 9; i++){
				if(fld[i] == 0.0) result[i] = 0.00;
				if(fld[i] == 1.0) result[i] = 1.00;
				else if(i == random) result[i] = sum;
				else if(result[i] > 0.875 && result[i] <= 1.0) result[i] = 1.0;
				else if(result[i] > 0.625 && result[i] <= 0.875) result[i] = 0.75;
				else if(result[i] > 0.375 && result[i] <= 0.625) result[i] = 0.50;
				else if(result[i] > 0.125 && result[i] <= 0.375) result[i] = 0.25;
				else if(result[i] > 0.00 && result[i] <= 0.125) result[i] = 0.00;
				this.clr(i, (player == 2 ? 1.0 - result[i] : result[i]));
			}
			
			//учим правилу
			app.net.train([{input:fld, output:result}], {iterations: 1000000, errorThresh: 0.00001, learningRate: 0.3});
			result = app.net.run(fld);
			
			//потом игрок кликает в клетку
			//this.clk(random);
		},
		clk: function(num){
			var gameover = this.gameover;
			if(gameover) {
				alert('Игра закончена, победил ' + gameover.win + ', проиграл ' + gameover.lose);
				this.clear();
			} else if(num >= 0 && num < 9 && !this.turns.some(function(n){ return n == num; })){
				/*var result = [], player = this.player, fld = this.fld;
				
				for(var i = 0; i < 9; i++) result.push(player - 1); result[num] = (2 - player);
				
				fld = fld.map(function(n){ return (n == 1 ? 0.0 : (n == 2 ? 1.0 : 0.5)) });
				
				app.net.train([{input:fld, output:result}], {iterations: 100000, learningRate: 0.3});*/
				
				this.turns.push(num);
				
			}
		}
	}
});

console.log(app.net.train([
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.75, 0.25, 0.75, 0.25, 1.00, 0.25, 0.75, 0.25, 0.75]}/*,
	
	{input:[0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[1.00, 0.75, 0.25, 0.75, 0.00, 0.75, 0.25, 0.75, 0.25]},
	
	{input:[0.0, 1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.00, 1.00, 0.25, 0.75, 1.00, 0.75, 0.25, 0.75, 0.25]}
	
	{input:[0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.25, 1.00, 0.25, 0.75, 0.00, 0.75, 0.25, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.25, 0.75, 1.00, 0.75, 0.00, 0.75, 0.25, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.0, 0.5, 0.5, 0.5, 0.5, 0.5], output:[0.25, 0.75, 0.25, 1.00, 0.00, 0.75, 0.25, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.5, 0.0, 0.5, 0.5, 0.5, 0.5], output:[0.25, 0.75, 0.25, 0.75, 1.00, 0.75, 0.25, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.5, 0.5, 0.5], output:[0.25, 0.75, 0.25, 0.75, 0.00, 1.00, 0.25, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.5, 0.5], output:[0.25, 0.75, 0.25, 0.75, 0.00, 0.75, 1.00, 0.75, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 0.5], output:[0.25, 0.75, 0.25, 0.75, 0.00, 0.75, 0.25, 1.00, 0.25]},
	{input:[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0], output:[0.25, 0.75, 0.25, 0.75, 0.00, 0.75, 0.25, 0.75, 1.00]}*/
], {iterations: 10000, errorThresh: 0.001, learningRate: 0.3}));