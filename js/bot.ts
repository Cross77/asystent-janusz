class Bot {
    name: string; // nazwa bota
    data: Array<Array<string>>; // baza danych
    data_helper: Array<Array<string>>; // pomocnicza baza do nowych powiązań
    data_jokes: Array<Array<string>>; // baza dowcipów
    question_state: { // czy stan pytania
      question: string, // treść pytania uzytkownika
      question_id: number // id pytania
    } | boolean; // lub false czyli brak pytania
    joke_state: boolean | number; // jezeli liczba to oznacza id zartu
    was_joke: boolean; // czy poprzednia wiadomosc byla zartem
    msg_counter: number; // licznik wiadomosci
    functions: {
      yes: Array<string>, // słowa potwierdzające
      no: Array<string>, // słowa przeczące
      clear: Array<string>, // słowa czyszcząca baze
      joke: Array<string>, // słowa proszące o żart
      jokeReaction: Array<string>, // słowa radości
      thank: Array<string> // słowa wdzięczności
    };
    constructor(cfg: {
      name: string; // nazwa bota
      data: Array<Array<string>>; // baza danych
      data_helper: Array<Array<string>>; // pomocnicza baza do nauki
      data_jokes: Array<Array<string>>; // baza dowcipów
      functions: {
        yes: Array<string>,
        no: Array<string>,
        clear: Array<string>,
        joke: Array<string>,
        jokeReaction: Array<string>,
        thank: Array<string>
      };
    }) {
        // przypisanie konfiguracji
        this.name = cfg.name;
        this.data = cfg.data;
        this.functions = cfg.functions;
        this.data_helper = cfg.data_helper;
        this.data_jokes = cfg.data_jokes;
        this.msg_counter = 0;
        this.question_state = false;
        this.joke_state = false;
        this.was_joke = false;
  
        // jezeli brak bazy
        if( this.data_jokes.length == 0 ||
            this.data.length == 0){
          this.log('BLAD KRYTYCZNY: NIEKOMPLETNA BAZA');
          throw new Error("BLAD KRYTYCZNY: niekompletna baza!");
        }
        // powitanie bota na start
        this.log(`Witaj, jestem asystent ${this.name}. W czym mogę pomóc?`);
  
    }
    // funkcja do przewijania w dół komunikatora
    private scrollDown(){
      // selektor do div'a chatu
      var $selector = $(".chat-history");
      // animacja przy użyciu jQuery
      $selector.animate({
          scrollTop: $selector.offset().top + $selector[0].scrollHeight
      }, 1000);
    }
    // wyświetlenie wiadomości użytkownika
    private sendByUser(msg: string){
      // aktualizacja licznika wiadomości
      $('#msg-counter').text(this.msg_counter++);
      // aktualna data
      var date = new Date();
      var htmlString = `
          <li class="clearfix">
              <div class="message-data align-right">
                  <span class="message-data-time">${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}</span> &nbsp; &nbsp;
                  <span class="message-data-name">Użytkownik</span> <i class="fa fa-circle me"></i>
                  
              </div>
              <div class="message other-message float-right">
                  ${msg}
              </div>
          </li>`;
      // wrzucenie wiadomosci do drzewa DOM
      $('.chat-history ul').append(htmlString);
      // animacja przewijania w dol
      setTimeout(this.scrollDown, 100);
    }
    // wyświetlenie wiadomości bota
    private sendByBot(msg: string){
      // aktualizacja licznika wiadomości
      $('#msg-counter').text(this.msg_counter++);
      // aktualna data
      var date = new Date();
      var htmlString = `
          <li>
              <div class="message-data">
                  <span class="message-data-name"><i class="fa fa-circle online"></i> Janusz</span>
                  <span class="message-data-time">${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}</span>
              </div>
              <div class="message my-message">
                  ${msg}
              </div>
          </li>`;
      // wrzucenie wiadomosci do drzewa DOM
      $('.chat-history ul').append(htmlString);
      // animacja przewijania w dol
      setTimeout(this.scrollDown, 100);
    }
    public log(str: string) {
      //document.getElementById('out').innerHTML += s + '<hr>';
      this.sendByBot(str);
    }
    private compare(x: string, y: string){
      var a = x.split(' '); // rozdziela string 
      var b = y.split(' '); // rozdziela string
      var matches = 0; // domyslnie 0 %
      a.forEach(function(e){ // przeszukanie wyrazow do porownania
        b.forEach(function(x){ // przeszukanie wyrazow
          // jezeli znalazl dopasowanie
          if( e == x ) matches++;
          })
      });
      // obliczanie procentow
      return matches * 100 / a.length;
    }
    // czy odpowiedz jest potwierdzajaca
    private isTrue(str: string){
      var ret = false;
      this.functions.yes.some(function(e){
        if(str == e){
          ret = true;
          return true;
        }
      });
      return ret;
    }
    // zapisanie nowego powiazania pytania
    private saveQuestion(){
      // jeżeli nie istnieje powiązanie to stwórz nowe puste
      if(typeof this.data_helper[this.question_state.question_id] == 'undefined')
        this.data_helper[this.question_state.question_id] = new Array();
      // przypisz powiązanie
      this.data_helper[this.question_state.question_id].push(this.question_state.question);
      this.log('Zapamietane !');
      this.log(this.data[this.question_state.question_id][1]);
      // aktualizacja stanu zapytania
      this.question_state = false;
      // todo to localstorange
    }
    // generowanie randomowej liczby
    private randomNumber(from, to){
      return Math.floor(Math.random() * to) + from;  
    }
    // zapytanie o żart przez bota
    private askJoke(){
      // losowanie żartu
      this.joke_state = this.randomNumber(1, this.data_jokes.length) - 1;
      this.log(this.data_jokes[this.joke_state][0]);
      this.was_joke = false;
    }
    // odpowiedz żartu bota
    private answerJoke(){
      // wyświetlenie odpowiedzi
      this.log(this.data_jokes[this.joke_state][1]);
      // zmiana stanów
      this.joke_state = false;
      this.was_joke = true;
    }
    // interpretacja wiadomosci
    public send(str: string):{
      percent: number,
      id: number
    } | false{
      var scope = this;
      this.sendByUser(str);
      // usuwanie znakow specjalnych
      str = str.replace(/[^a-zA-ZążćółśęĄŻĆÓŁŚĘ ]/g, "");
      // transformacja na male znaki
      str = str.toLowerCase();
      // jezeli ostatnio byl zart
      if( this.was_joke ){
        this.was_joke = false;
        // to sprawdz czy user sie zasmial
        this.functions.joke.some(function(e){
          if( str.search(e) != -1){
            scope.askJoke();
            return true;
          }
        });
        // czy jest reakcja uzytkownika
        var is_reaction = false;
        this.functions.jokeReaction.some(function(e){
          if( str.search(e) != -1){
            is_reaction = true;
            return true;
          }
        });
        // jezeli jest reakcja uzytkownika
        if(is_reaction){
          this.log('Ciesze się że spodobał Ci się mój żart :)');
          return false;
        }
      }
      // zmiana stanu was_joke
      this.was_joke = true;
      // jezeli ostatnio wyslal pierwsza czesc zartu
      if(typeof this.joke_state == 'number'){
        this.answerJoke();
        return false;
      // jezeli jest stan oczekiwania na odpowiedz
      }else if(this.question_state){
        if(this.isTrue(str)){
          // stworzenie powiązania
          this.saveQuestion();
          return false;
        }else{
          // zmiana stanu
          this.question_state = false;
          this.log('Przepraszam, spróbuj inaczej zadać pytanie..');
          return false;
        }
        // zmiana stanu
        this.question_state = false;
      }else{
        // sprawdzanie czy user chce zartu
        this.functions.joke.some(function(e){
          if( str.search(e) != -1){
            scope.askJoke();
            return true;
          }
        });
        // jezeli stan zartu
        if(this.joke_state !== false){
          return false;
        }else{
          // czy user podziekowal za pomoc
          var thanks = false;
          this.functions.thank.some(function(e){
            if( str.search(e) != -1){
              thanks = true;
              return true;
            }
          });
          // jezeli user podziekowal
          if(thanks){
            this.log('Proszę bardzo, służę pomocą :)');
          }else{
            // szukanie normalnej odpowiedzi
            return this.findAnswer(str);
          }
        }
      }
    }
    // szukanie odp na pytanie 
    private findAnswer(str: string):{
      percent: number, // najlepsze procentowe dopasowanie
      id: number // id najlepszego zapytania
    }{
      // najlepszy wynik
      var best = {
        percent: -1, // najlepsze procentowe dopasowanie
        id: -1 // id najlepszego zapytania
      };
      var scope = this;
      
      // tymczasowa zmienna do przechowania wyniku funkcji
      var temp = 0;
      // przeszukanie tablicy
      this.data.forEach(function(e: Array<string>,id: number){
        temp = scope.compare(str, e[0]);
        if( best.percent < temp ){
          best.id = id;
          best.percent = temp;
        }
      });
      // jezeli mniej niz 50% porównania
      if(best.percent < 50){
        // to niech poszuka w bazie pomocnej
        var helper = this.findInHelper(str);
        // jezeli wynik pomocny jest gorszy niz wczesniej znaleziony
        if( helper.percent < best.percent){
          // jezeli procent jest wiekszy niz 0
          if(best.percent > 0){
            // podaj propozycje i czekaj na odpowiedz
            this.log('Czy chodzi Ci o? : ' + this.data[best.id][0]);
            // zmiana stanu
            this.question_state = {
              question: str,
              question_id: best.id
            }
          }else{
            this.log('Przykro mi, nie rozumiem');
          }
          
        }else{ // jezeli wynik pomocny jest lepszy
          if(helper.percent > 50){ // jezeli wynik jest lepszy 
            this.log(this.data[helper.id][1]);
            return helper;
          }else if(helper.percent > 0){
            this.log('Czy chodzi Ci o? : ' + this.data[helper.id][0]);
            // zmiana stanu
            this.question_state = {
              question: str,
              question_id: helper.id
            }
          }else{
            this.log('Przykro mi, nie rozumiem');
          }
          
        }
      }else{ // jezeli wszystko ok
        // wyswietli odpowiedz
        this.log(this.data[best.id][1]);
      }
      return best;
    }
    // szukanie w tablicy pomocnej
    // czyli tej ktorej sie asystent "uczy"
    // a raczej laczy ze soba pytania
    private findInHelper(str: string):{
      percent: number,
      id: number
    }{
      // najlepszy wynik
      var best = {
        percent: -1, // najlepsze procentowe dopasowanie
        id: -1 // id najlepszego dopasowania
      }
      var scope = this;
      var temp = 0;
      this.data_helper.forEach(function(e: Array<string>,id: number){
        e.forEach(function(_e,_id){
          temp = scope.compare(str, _e);
          if( best.percent < temp ){
            best.id = id;
            best.percent = temp;
          }
        })
      });
      return best;
    }
  }
  
// podstawowa konfiguracja
var cfg = {
  name: 'Janusz',
  data: false, // to zostanie pobrane później
  data_jokes: false, // to zostanie pobrane później
  data_helper: new Array(), // pusta tab pozwiązań ale można ją po prostu skądś odczytywac i zapisywac
  functions: {
    // słowa potwierdzające
    yes: ['tak', 'tk', 'ta', 'jasne', 'oczywiście', 'oczywiscie', 'mhm', 'no', 'nom', 'pewnie'],
    // słowa przeczące
    no: ['nie', 'ni', 'nope', 'ne', 'chyba ty'],
    // słowa klucz proszące o żart
    joke: ['żart', 'zart', 'dowcip', 'śmieszne', 'śmiesznego', 'smiesznego', 'smieszne', 'zaratruj', 'zażartuj'],
    // definicja pozytywnej reakcji na żart
    jokeReaction: ['ha', 'he', 'hehe', 'haha', 'heh', 'hah', 'hahah', 'heheh'],
    // prośba o wyczyszczenie bazy
    clear: ['zapomnij baze', 'wyczysc baze', 'wyczyść bazę', 'wyczyść bazę', 'zapomnij bazę'],
    // definicja podziękowania
    thank: ['dzięki', 'dzieki', 'thx', 'dziex', 'dziękuję', 'dziekuje', 'dziękuje', 'dziekuję']
  }
}
var app;
  
// rejestracja eventow html
function events(){
  // klikniecie w przycisk send
  $('#btn-send').on('click', function(){
    var text = $('#message-to-send').val();
    $('#message-to-send').val('');
    var best = app.send(text);
    if(best != false) console.log(`${best.percent}% ID:${best.id}`);
  });
  // wcisnienie enter w polu
  $("#message-to-send").on('keyup', function (e) {
      if (e.keyCode == 13) {
        $('#btn-send').trigger('click');
      }
  });
}
// po zaladowaniu strony
$(function(){
  // uzyskanie podstawowej bazy
  // przez wykonanie zapytania GET po bazę w JSON
  $.getJSON('data/data.json', function(data) {
    cfg.data = data;
    // jeżeli obie bazy zostały załadowane
    if(cfg.data && cfg.data_jokes){
      // tworzenie nowej instancji
      app = new Bot(cfg);
      // rejestracja zdarzen
      events();
    }
  });
  // uzyskanie bazy z zartami
  // przez wykonanie zapytania GET po bazę w JSON
  $.getJSON('data/jokes.json', function(data) {
    cfg.data_jokes = data;
    // jeżeli obie bazy zostały załadowane
    if(cfg.data && cfg.data_jokes){
      // tworzenie nowej instancji
      app = new Bot(cfg);
      // rejestracja zdarzen
      events();
    }
  });
})
