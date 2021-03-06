// je charge le module crypto qui nous permettra de hasher nos chaines de caractere
const crypto = require('crypto');

class BloomFilter{
  constructor(n = 128, k = 3){
    this.size = n;
    // je crée un tableau storage de n size cases, rempli de 0
    this.storage = new Array(this.size).fill(0);
    // je crée deux tableaux: encountered contenant les entry ajoutée et key la map key pour facilement retrouver les entry passée
    this.encountered = [];
    this.key = [];
    for (let i = 0; i < this.size; i++){
        this.key[i] = [];
    }
    // je crée un tableau algo contenant les k algorithmes utilisés pour hasher mes entrées
    const secureHashAlgorithms = ["sha1", "sha256", "sha512"];
    this.algo = [];
    for (let i = 0; i < k && i < secureHashAlgorithms.length; i++){
      this.algo.push(secureHashAlgorithms[i]);
    }
  }

  add(entry){
    // je stock la chaine rencontrée si c'est le premier ajout
    if (this.encountered.includes(entry) === true){
      return;
    }
    this.encountered.push(entry);
    // je stock l'indice dans le tableau encountered de la nouvelle entrée
    const entryId = this.encountered.length - 1;
    // j'envoie la chaine entry à mes fonctions de hash; chaque fonction retourne un nombre indice entre 0 et n size
    // on marque ces indice à 1 dans notre tableau storage
    for (let i = 0; i < this.algo.length; i++){
      let hashedId = this.hashToId(entry, this.algo[i]);
      this.storage[hashedId] = 1;
      // je vérifie que l'on a pas déjà ajouté cet indice à notre tableau key pour l'indice hashedId
      if (this.key[hashedId][this.key[hashedId].length - 1] !== entryId){
        this.key[hashedId].push(entryId);
      }
    }
  }

  test(testWord){
    // on test si la chaine str est probablement présente dans notre tableau storage
    // pour cela on vérifie dans notre tableau que les valeurs aux indice fournis par les functions de hash sont bien des 1 et non des 0
    // si c'est le cas on retourne un boolean true (la chaine str est probablement passer par notre filter)
    // sinon on retourne false: la chaine str n'est jamais passée par notre filter car on a rencontré un 0
    for (let i = 0; i < this.algo.length; i++){
      if (Boolean(this.storage[this.hashToId(testWord, this.algo[i])]) === false){
        return false;
      }
    }
    return true;
  }

  logPresent(searched){
    // je stock les indices du hash du mot searched
    const searchedIds = [];
    for (let i = 0; i < this.algo.length; i++){
      searchedIds.push(this.hashToId(searched, this.algo[i]));
    }
    // je stock dans un tableau aux indices searchedIds trouvés les chaines présentes ou passées à cet indice
    let commonByHashedId = [];
    commonByHashedId = searchedIds.map(searchId => [searchId, this.key[searchId].map(encounteredId => this.encountered[encounteredId])]);
    console.log(commonByHashedId);
    return commonByHashedId;
  }

  // hash une chaine de caractere, retourne un indice généré depuis la chaine hashée, entre 0 et n size
  hashToId(str, algo){
    // création de mon object hasher utilisé pour générer des hash avec l'algorithme passé en paramètre
    let hasher = crypto.createHash(algo);
    // je mets à jour le contenu de notre hasher avec la chaine de caractere à hasher
    hasher.update(str);
    // on "digere" le hash de la donnée présente dans le hasher, nous retourne une chaine unique en hexadecimal
    const hash = hasher.digest('hex');
    // je crée une variable hashSum qui sera égale à la somme des valeurs ascii de ma chaine de caractere hash
    let hashSum = 0;
    for (let i = 0; i < hash.length; i++){
      hashSum += hash[i].charCodeAt();
    }
    // je retourne hashSum modulo n size, pour m'assurer d'avoir un indice compris entre 0 et n size
    return hashSum % this.size;
  }
}

module.exports = BloomFilter;

// la fonction getLeastCollisionHash(elemCount, size) retourne le nombre d'algo générant le moins de collision pour elemCount nombre d'éléments et size la taille de notre storage
function getLeastCollisionHash(elemCount, size){
  // je crée un tableau de mots générés aléatoirement
  let randomWords = [];
  for (let i = 0; i < elemCount; i++){
    // génere une chaine de six charactères aléatoires (0 <= char < 10 || a <= char <= z)
    randomWords.push(Math.random().toString(36).substring(7));
  }
  // lessColHash contiendra le nombre de collision à l'indice k - 1
  const lessColHash = [];
  // on répète pour les 0 < k <= 3 algorithmes
  for (let k = 1; k <= 3; k++){
    // on crée un nouveau filter que l'on va remplir avec elemCount entry
    let filter = new BloomFilter(size, k);
    let collision = 0;
    let pastIndexCount = 0;
    // on ajoute les elemCount entry au storage du filter avec add(entry)
    for (let i = 0; i < elemCount; i++){
      filter.add(randomWords[i]);
      // je crée une chaine de caractères à partir du tableau storage, je crée un array (un nouvel élement à chaque 0 rencontré)
      //je recolle le tout pour former une chaine de 1 (mon nombre d'indice ajouté)
      // si le on trouve le meme nombre de 1 dans notre storage qu'au précédant passage on peut déduire qu'il y a eu collision
      if (filter.storage.join("").split("0").join("").length === pastIndexCount){
        collision++;
      }
      // on stock le nombre de 1 présent dans le storage actuellement
      pastIndexCount = filter.storage.join("").split("0").join("").length;
    }
    // s'il n'y a pas eu de collision je retourne le k courant (pas besoin de véfier le reste des cas)
    if (collision === 0){
      return (k);
    }
    // j'ajoute le nombre de collision calculé à l'indice k - 1
    lessColHash.push(collision);
  }
  // je retourne l'indice + 1 du min de notre tableau lessColHash, le nombre k d'algorithme utilisé produisant le moins de collisions
  return (lessColHash.indexOf(Math.min.apply(null, lessColHash)) + 1);
}

// test cases pour getLeastCollisionHash(elemCount, size)

// si l'on veut savoir avec x occurences, quel nombre k d'algorithmes produit le moins de collision
// on affiche, dans un array count, le nombre de fois que le nombre indice k a produit le moins de collision
// let x = 100;
// let count = [0, 0, 0]
// for (let i = 0; i < x; i++){
//     count[getLeastCollisionHash(80, 1280) - 1] += 1;
// }
// console.log(count);

//console.log(getLeastCollisionHash(20, 128))
//console.log(getLeastCollisionHash(80, 128))

// test cases pour logPresent(searched)

// let filter = new BloomFilter(6, 3);
// filter.add("word1");
// filter.add("word2");
// filter.add("word3");
// filter.logPresent("word1");
// filter.logPresent("word2");
// filter.logPresent("word3");
