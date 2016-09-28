
'use strict'

import config from '../config.js';
import request from 'request';
import fs from 'fs';
import listOfChampions from './listOfChampions.json';
import lodash from 'lodash';
import { Utils } from '../utils'
import sleep from 'sleep';

// For Development
import { SampleData } from '../sampleData';

class ChampionggApi {
  constructor(outputPath){
    this.endpoints = {
      championData : "http://api.champion.gg/champion"
    }

    this.listOfChampions = listOfChampions;

    this.rawOutput = 'raw.txt';

    this.outputPath = outputPath;

    this.sampleData = new SampleData();

    this.utils = new Utils();
  }

  getToken = () => {
    return "?api_key="+config.championGGToken;
  }

  convertChampionData(){

    var doWrite = (data)=>{

      if(!data) return;

      var jsonData;

      try{
        jsonData = JSON.parse(data);

        fs.appendFile(this.rawOutput,JSON.stringify(jsonData,null,2),function(err){
          if(err) return console.log(err);
        })
      }catch (e){
        console.log(e);
      }

      for(var c of jsonData){
        for(var r of c.roles){
          var sentence = `${c.key} is played as a ${r.name} lane ${r.percentPlayed}% of the time\n`;
          fs.appendFile(this.outputPath,sentence,function(err){
            if(err) return console.log(err);
          })
        }
      }
    }

    // Comment this out for production
    // doWrite(this.sampleData.championData);
    // return;

    request(this.endpoints.championData+this.getToken(), function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // Write it out in document
        doWrite(body);
      }else{
        console.log(`There was an error with overall champion data`, error);
      }
    })
  }

  convertOneChampionData(){

    var listItems = (items)=>{
      return lodash.flatMap(items,(i)=>{ return i.name })
    }

    var matrixRating = (number)=>{
      if(number < 20){
        return 'almost no';
      }else if(number < 40){
        return 'tiny';
      }else if (number < 80){
        return 'small';
      }else if (number < 110){
        return 'average';
      }else if (number < 120){
        return 'bit more than average';
      }else if (number < 160){
        return 'many';
      }else if (number < 180){
        return 'tons of';
      }else{
        return 'insane';
      }
    }

    var runesList = (runes)=>{
      var set = "";
      for(var r of runes){
        set+=`${r.number} ${r.name} (${r.description}),`;
      }
      return set;
    }

    var matchups = (c) => {
      var block = "";
      var name = c.key;
      for (var m of c.matchups){
        block += `
        ${name} wins ${m.winRate}% of the time against ${m.key} in ${c.role} lane
        `
        if(m.statScore < 3){
          block+=`${name} gets countered by and is bad against ${m.key} in ${c.role} lane`
        }else if(m.statScore > 7){
          block+=`${name} counters and is good against ${m.key} in ${c.role} lane`
        }

      }
      return block;
    }

    var masteries = (c) => {
      var block = "";
      var name = c.key;
      var popular = c.masteries.mostGames.masteries;
      var best = c.masteries.highestWinPercent.masteries;

      if(!popular[0] || !best[0]) return;

      block+=`
      ${name} most popular masteries are ${popular[0].total}x ${popular[0].tree}, ${popular[1].total}x ${popular[1].tree}, ${popular[2].total}x ${popular[2].tree}
      ${name} best masteries are ${best[0].total}x ${best[0].tree}, ${best[1].total}x ${best[1].tree}, ${best[2].total}x ${best[2].tree}
      `
      return block;
    }

    var doWrite = (data)=>{
      if(!data) return;
      var jsonData;

      try{
        jsonData = JSON.parse(data);

        fs.appendFile(this.rawOutput,JSON.stringify(jsonData,null,2),function(err){
          if(err) return console.log(err);
        })
      }catch (e){
        console.log(e);
      }

      for(var c of jsonData){
        var name = c.key;
        var block = `
        ${name} is a ${c.role} lane champion
        ${name} is currently ranked ${c.overallPosition.position} as an overall champion
        ${name} moved ${c.overallPosition.change < 0 ? "down" : "up"} ${c.overallPosition.change} rankings since last patch in ${c.role} lane

        ${name}'s most popular build is ${listItems(c.items.mostGames.items)} and it wins ${c.items.mostGames.winPercent}% of the time in ${c.role} lane
        ${name}'s best build is ${listItems(c.items.highestWinPercent.items)} and it wins ${c.items.highestWinPercent.winPercent}% of the time in ${c.role} lane

        ${name}'s most popular starting build is ${listItems(c.firstItems.mostGames.items)} and it wins ${c.firstItems.mostGames.winPercent}% of the time in ${c.role} lane
        ${name}'s best starting build is ${listItems(c.firstItems.highestWinPercent.items)} and it wins ${c.firstItems.highestWinPercent.winPercent}% of the time in ${c.role} lane

        ${name}'s has ${matrixRating(c.championMatrix[0])} wins in ${c.role} lane
        ${name}'s earns ${matrixRating(c.championMatrix[1])} gold in ${c.role} lane
        ${name}'s gets ${matrixRating(c.championMatrix[2])} kills in ${c.role} lane
        ${name}'s has ${matrixRating(c.championMatrix[3])} assists in ${c.role} lane
        ${name}'s has ${matrixRating(c.championMatrix[4])} deaths wins in ${c.role} lane
        ${name}'s deals ${matrixRating(c.championMatrix[5])} damage wins in ${c.role} lane
        ${name}'s takes ${matrixRating(c.championMatrix[6])} damage wins in ${c.role} lane

        ${name}'s with ${c.trinkets[0].item.name} trinket wins ${c.trinkets[0].item.winPercent}% of the time in ${c.role} lane

        ${name}'s most popular summoners ${c.summoners.mostGames.summoner1.name} and ${c.summoners.mostGames.summoner2.name} wins ${c.summoners.mostGames.winPercent}% of the time in ${c.role} lane
        ${name}'s best summoners ${c.summoners.highestWinPercent.summoner1.name} and ${c.summoners.highestWinPercent.summoner2.name} wins ${c.summoners.highestWinPercent.winPercent}% of the time in ${c.role} lane

        ${name}'s most popular runes are ${runesList(c.runes.mostGames.runes)} and wins ${c.runes.mostGames.winPercent}% of the time in ${c.role} lane
        ${name}'s best runes are ${runesList(c.runes.highestWinPercent.runes)} and wins ${c.runes.highestWinPercent.winPercent}% of the time in ${c.role} lane

        ${name}'s best runes are ${runesList(c.runes.highestWinPercent.runes)} and wins ${c.runes.highestWinPercent.winPercent}% of the time in ${c.role} lane

        ${matchups(c)}

        ${name} most popular skill tree order is ${c.skills.mostGames.order.toString()} in ${c.role} lane
        ${name} best skill tree order is ${c.skills.highestWinPercent.order.toString()} in ${c.role} lane

        ${name} best skill tree order is ${c.skills.highestWinPercent.order.toString()} in ${c.role} lane

        ${masteries(c)}
        `;

        fs.appendFile(this.outputPath,block,function(err){
          if(err) return console.log(err);
        })

        console.log(`Finished output for: ${name}`);
      }
    }

    // Comment this out for production
    // doWrite(this.sampleData.oneChampionData);
    // return;

    // For each champion make a request
    for(var c of this.listOfChampions){
      if(c){
        console.log(`requesting data for: ${c}`);
        request(this.endpoints.championData+`/${c}`+this.getToken(), function (error, response, body) {
          if (!error && response.statusCode == 200) {
            // Write it out in document
            doWrite(body);
          }else{
            console.log(`There was an error with ${c}'s' data`, error);
          }
        })
        sleep.sleep(2);
      }
    }

  }

  convertToHtml(){
    // Clear outputfile
    fs.writeFile(this.outputPath, '', function(){console.log('Cleared output file')})
    fs.writeFile(this.rawOutput, '', function(){console.log('Cleared raw data')})

    // Fetch and convert play rate
    this.convertChampionData();

    // Fetch and convert champion data
    this.convertOneChampionData();

  }
}

export default ChampionggApi;
