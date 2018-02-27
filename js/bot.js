var Bot = /** @class */ (function () {
    function Bot(cfg) {
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
        if (this.data_jokes.length == 0 ||
            this.data.length == 0) {
            this.log('BLAD KRYTYCZNY: NIEKOMPLETNA BAZA');
            throw new Error("BLAD KRYTYCZNY: niekompletna baza!");
        }
        this.log("Witaj, jestem asystent " + this.name + ". W czym mog\u0119 pom\u00F3c?");
    }
    Bot.prototype.scrollDown = function () {
        var $selector = $(".chat-history");
        $selector.animate({
            scrollTop: $selector.offset().top + $selector[0].scrollHeight
        }, 1000);
    };
    Bot.prototype.sendByUser = function (msg) {
        $('#msg-counter').text(this.msg_counter++);
        var date = new Date();
        var htmlString = "\n          <li class=\"clearfix\">\n              <div class=\"message-data align-right\">\n                  <span class=\"message-data-time\">" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "</span> &nbsp; &nbsp;\n                  <span class=\"message-data-name\">U\u017Cytkownik</span> <i class=\"fa fa-circle me\"></i>\n                  \n              </div>\n              <div class=\"message other-message float-right\">\n                  " + msg + "\n              </div>\n          </li>";
        $('.chat-history ul').append(htmlString);
        setTimeout(this.scrollDown, 100);
    };
    Bot.prototype.sendByBot = function (msg) {
        $('#msg-counter').text(this.msg_counter++);
        var date = new Date();
        var htmlString = "\n          <li>\n              <div class=\"message-data\">\n                  <span class=\"message-data-name\"><i class=\"fa fa-circle online\"></i> Janusz</span>\n                  <span class=\"message-data-time\">" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "</span>\n              </div>\n              <div class=\"message my-message\">\n                  " + msg + "\n              </div>\n          </li>";
        $('.chat-history ul').append(htmlString);
        setTimeout(this.scrollDown, 100);
    };
    Bot.prototype.log = function (str) {
        //document.getElementById('out').innerHTML += s + '<hr>';
        this.sendByBot(str);
    };
    Bot.prototype.compare = function (x, y) {
        var a = x.split(' '); // rozdziela string 
        var b = y.split(' '); // rozdziela string
        var matches = 0; // domyslnie 0 %
        a.forEach(function (e) {
            b.forEach(function (x) {
                // jezeli znalazl dopasowanie
                if (e == x)
                    matches++;
            });
        });
        // obliczanie procentow
        return matches * 100 / a.length;
    };
    Bot.prototype.isTrue = function (str) {
        var ret = false;
        this.functions.yes.some(function (e) {
            if (str == e) {
                ret = true;
                return true;
            }
        });
        return ret;
    };
    Bot.prototype.saveQuestion = function () {
        if (typeof this.data_helper[this.question_state.question_id] == 'undefined')
            this.data_helper[this.question_state.question_id] = new Array();
        this.data_helper[this.question_state.question_id].push(this.question_state.question);
        this.log('Zapamietane !');
        this.log(this.data[this.question_state.question_id][1]);
        this.question_state = false;
        // todo to localstorange
    };
    Bot.prototype.randomNumber = function (from, to) {
        return Math.floor(Math.random() * to) + from;
    };
    Bot.prototype.askJoke = function () {
        this.joke_state = this.randomNumber(1, this.data_jokes.length) - 1;
        this.log(this.data_jokes[this.joke_state][0]);
        this.was_joke = false;
    };
    Bot.prototype.answerJoke = function () {
        this.log(this.data_jokes[this.joke_state][1]);
        this.joke_state = false;
        this.was_joke = true;
    };
    Bot.prototype.send = function (str) {
        var scope = this;
        this.sendByUser(str);
        // usuwanie znakow specjalnych
        str = str.replace(/[^a-zA-ZążćółśęĄŻĆÓŁŚĘ ]/g, "");
        // transformacja na male znaki
        str = str.toLowerCase();
        // jezeli ostatnio byl zart
        if (this.was_joke) {
            this.was_joke = false;
            // to sprawdz czy user sie zasmial
            this.functions.joke.some(function (e) {
                if (str.search(e) != -1) {
                    scope.askJoke();
                    return true;
                }
            });
            // czy jest reakcja uzytkownika
            var is_reaction = false;
            this.functions.jokeReaction.some(function (e) {
                if (str.search(e) != -1) {
                    is_reaction = true;
                    return true;
                }
            });
            if (is_reaction) {
                this.log('Ciesze się że spodobał Ci się mój żart :)');
                return false;
            }
        }
        this.was_joke = true;
        // jezeli ostatnio wyslal pierwsza czesc zartu
        if (typeof this.joke_state == 'number') {
            this.answerJoke();
            return false;
            // jezeli jest stan oczekiwania na odpowiedz
        }
        else if (this.question_state) {
            if (this.isTrue(str)) {
                this.saveQuestion();
                return false;
            }
            else {
                this.question_state = false;
                this.log('Przepraszam, spróbuj inaczej zadać pytanie..');
                return false;
            }
            this.question_state = false;
        }
        else {
            // sprawdzanie czy user chce zartu
            this.functions.joke.some(function (e) {
                if (str.search(e) != -1) {
                    scope.askJoke();
                    return true;
                }
            });
            // jezeli stan zartu
            if (this.joke_state !== false) {
                return false;
            }
            else {
                // czy user podziekowal za pomoc
                var thanks = false;
                this.functions.thank.some(function (e) {
                    if (str.search(e) != -1) {
                        thanks = true;
                        return true;
                    }
                });
                // jezeli user podziekowal
                if (thanks) {
                    this.log('Proszę bardzo, służę pomocą :)');
                }
                else {
                    // szukanie normalnej odpowiedzi
                    return this.findAnswer(str);
                }
            }
        }
    };
    Bot.prototype.findAnswer = function (str) {
        // najlepszy wynik
        var best = {
            percent: -1,
            id: -1 // id wyniku
        };
        var scope = this;
        // tymczasowa zmienna do przechowania wyniku funkcji
        var temp = 0;
        // przeszukanie tablicy
        this.data.forEach(function (e, id) {
            temp = scope.compare(str, e[0]);
            if (best.percent < temp) {
                best.id = id;
                best.percent = temp;
            }
        });
        // jezeli mniej niz 50% porównania
        if (best.percent < 50) {
            // to niech poszuka w bazie pomocnej
            var helper = this.findInHelper(str);
            // jezeli wynik pomocny jest gorszy niz wczesniej znaleziony
            if (helper.percent < best.percent) {
                // jezeli procent jest wiekszy niz 0
                if (best.percent > 0) {
                    // podaj propozycje i czekaj na odpowiedz
                    this.log('Czy chodzi Ci o? : ' + this.data[best.id][0]);
                    this.question_state = {
                        question: str,
                        question_id: best.id
                    };
                }
                else {
                    this.log('Przykro mi, nie rozumiem');
                }
            }
            else {
                if (helper.percent > 50) {
                    this.log(this.data[helper.id][1]);
                    return helper;
                }
                else if (helper.percent > 0) {
                    this.log('Czy chodzi Ci o? : ' + this.data[helper.id][0]);
                    this.question_state = {
                        question: str,
                        question_id: helper.id
                    };
                }
                else {
                    this.log('Przykro mi, nie rozumiem');
                }
            }
        }
        else {
            this.log(this.data[best.id][1]);
        }
        return best;
    };
    // szukanie w tablicy pomocnej
    // czyli tej ktorej sie asystent "uczy"
    // a raczej laczy ze soba pytania
    Bot.prototype.findInHelper = function (str) {
        // najlepszy wynik
        var best = {
            percent: -1,
            id: -1 // id wyniku
        };
        var scope = this;
        var temp = 0;
        this.data_helper.forEach(function (e, id) {
            e.forEach(function (_e, _id) {
                temp = scope.compare(str, _e);
                if (best.percent < temp) {
                    best.id = id;
                    best.percent = temp;
                }
            });
        });
        return best;
    };
    return Bot;
}());
var cfg = {
    name: 'Janusz',
    data: false,
    data_jokes: false,
    data_helper: new Array(),
    functions: {
        yes: ['tak', 'tk', 'ta', 'jasne', 'oczywiście', 'oczywiscie', 'mhm', 'no', 'nom', 'pewnie'],
        no: ['nie', 'ni', 'nope', 'ne', 'chyba ty'],
        joke: ['żart', 'zart', 'dowcip', 'śmieszne', 'śmiesznego', 'smiesznego', 'smieszne', 'zaratruj', 'zażartuj'],
        jokeReaction: ['ha', 'he', 'hehe', 'haha', 'heh', 'hah', 'hahah', 'heheh'],
        clear: ['zapomnij baze', 'wyczysc baze', 'wyczyść bazę', 'wyczyść bazę', 'zapomnij bazę'],
        thank: ['dzięki', 'dzieki', 'thx', 'dziex', 'dziękuję', 'dziekuje', 'dziękuje', 'dziekuję']
    }
};
var app;
// rejestracja eventow
function events() {
    $('#btn-send').on('click', function () {
        var text = $('#message-to-send').val();
        $('#message-to-send').val('');
        var best = app.send(text);
        if (best != false)
            console.log(best.percent + "% ID:" + best.id);
    });
    $("#message-to-send").on('keyup', function (e) {
        if (e.keyCode == 13) {
            $('#btn-send').trigger('click');
        }
    });
}
$(function () {
    $.getJSON('data/data.json', function (data) {
        cfg.data = data;
        if (cfg.data && cfg.data_jokes) {
            app = new Bot(cfg);
            events();
        }
    });
    $.getJSON('data/jokes.json', function (data) {
        cfg.data_jokes = data;
        if (cfg.data && cfg.data_jokes) {
            app = new Bot(cfg);
            events();
        }
    });
});
