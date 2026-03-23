# GitHub'ile üleslaadimise juhend

## 📋 Samm-sammult juhised

### 1. Loogige GitHubisse

- Avage [GitHub.com](https://github.com)
- Logige oma kontoga sisse

### 2. Uue repositooriumi loomine

- Klõpsake `+` ikooni üleval paremal
- Valige "New repository"
- Nimega: `turvamees`
- Kirjeldus: "Real-time motion detection web application with Node.js"
- Valige "Public" (et näha portfoolios)

### 3. Git seadistamise käsud

Avage terminal ja käitage:

```bash
cd "c:\Users\user\Documents\NPMM25\HTML CSS JS\My work\Turvamees"

# Kontrollida remote'i
git remote -v

# Lisa GitHub'i remote (asenda yourusername oma GitHubi kasutajanimega)
git remote add origin https://github.com/yourusername/turvamees.git

# Muuda branch nimi (vajalik GitHub'i algoritmides)
git branch -M main

# Lükka failid GitHub'i
git push -u origin main
```

### 4. Verifikaatsioon

- Avage oma GitHub profile
- Vaate uus "turvamees" repositoorium
- Veenduge, et kõik failid on nähtavad

## 🔐 SSH võtme seadistamine (täitsa valiultuine)

Kui "Personal Access Token" seadistamine on arvukas:

```bash
# SSH võtme loomine
ssh-keygen -t ed25519 -C "your@email.com"

# Võtme kopeerimine (Windows)
Get-Content c:\Users\user\.ssh\id_ed25519.pub | Set-Clipboard

# Logi GitHubisse ja lisa võti:
# Settings > SSH and GPG keys > New SSH key
```

## 📝 Commit'i kirjutamine

Hea komemmit'i kirje näeb välja järgmiselt:

```bash
# Rakendustes muudatused
git add .

# Commit'i
git commit -m "✨ Lisa feature description"

# Push
git push
```

## 📝 Commit'i liigid

- `🚀 :rocket:` - Uus funktsioon
- `🐛 :bug:` - Viga parandatud
- `📝 :memo:` - Dokumentatsioon
- `🎨 :art:` - Disain/stiil
- `⚙️ :gear:` - Seaded
- `🔧 :wrench:` - Parandused
- `✅ :white_check_mark:` - Teste
- `🏁 :checkered_flag:` - Täielik versioon

## 🔗 Portfoolio linkimise

1. Avage oma portfoolio leht
2. Lisage link:
```html
<a href="https://github.com/yourusername/turvamees" target="_blank">
  Turvamees - Motion Detection App
</a>
```

3. Või lõimi otseselt rakendusele (kui hostitud):
```html
<a href="https://turvamees-app.herokuapp.com" target="_blank">
  Vaata rakendust
</a>
```

## 🚀 Juurutamine Heroku'le

### 1. Heroku CLI installatsioon

```bash
# Laadige alla ja installige Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli
```

### 2. Login ja app loomine

```bash
heroku login

cd "c:\Users\user\Documents\NPMM25\HTML CSS JS\My work\Turvamees"

heroku create your-app-name
```

### 3. Juurutamine

```bash
git push heroku main
```

### 4. Vaadake rakendust

```bash
heroku open
```

## 📱 GitHub README

Teie `README.md` peab sisaldama:

- ✅ Projekti kirjeldus
- ✅ Screenshots/demovideo
- ✅ Omaduste loend
- ✅ Installatsioonijuhised
- ✅ Kasutamise juhend
- ✅ Tehniline teave
- ✅ Litsents
- ✅ Kontaktiinfo

## 🎯 Parimad praktikad

1. **Commit'i regulaarselt** - Ei tehke suuri muudatusi korraga
2. **Kirjutage heast commit'i kirjeldused** - Teistel lihtne aru saada
3. **Kasutage branches** - Suurte muudatuste jaoks
4. **Hallake lienega gitignore** - Ära lükka node_modules

## 🆘 Tõrkeotsing

### "fatal: not a git repository"
```bash
git init
git add .
git commit -m "Initial commit"
```

### "permission denied"
```bash
# Kontrollid SSH võtit
ssh -T git@github.com
```

### "Invalid credentials"
- Resetige Personal Access Token
- Uuesti seadistage git

---

**Helpfull lingid**:
- [GitHub Help](https://help.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Heroku Docs](https://devcenter.heroku.com)
