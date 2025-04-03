const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Criar/Conectar ao banco de dados existente
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }

  console.log("Banco conectado com sucesso.");

  // Criar tabela se não existir
  db.run(
    `CREATE TABLE IF NOT EXISTS perguntas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pergunta TEXT,
      resposta TEXT,
      palavras_chave TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Erro ao criar tabela:", err);
        return;
      }

      console.log("Tabela verificada/criada com sucesso.");

      // Verificar se a tabela está vazia
      db.get(`SELECT COUNT(*) as count FROM perguntas`, (err, row) => {
        if (err) {
          console.error("Erro ao verificar tabela:", err);
          return;
        }

        // Se a tabela estiver vazia, inserir dados iniciais
        if (row.count === 0) {
          db.run(
            `INSERT INTO perguntas (pergunta, resposta, palavras_chave) VALUES (?, ?, ?)`,
            [
              "Onde encontro o site da sefin?",
              `Você pode acessar <a href="https://www.sefin.fortaleza.ce.gov.br/Home" target="_blank">aqui</a>.`,
              "site,sefin,acessar,endereço,página,web",
            ],
            function (err) {
              if (err) {
                console.error("Erro ao inserir dados iniciais:", err);
              } else {
                console.log(`Dados iniciais inseridos com sucesso. ID: ${this.lastID}`);
              }
            }
          );
        } else {
          console.log("Tabela já contém dados, pulando inserção inicial.");
        }
      });
    }
  );
});

app.post("/perguntar", (req, res) => {
  const { pergunta } = req.body;

  if (!pergunta) {
    return res.status(400).json({ error: "A pergunta é obrigatória." });
  }

  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const perguntaNormalizada = normalizarTexto(pergunta);
  const palavrasUsuario = perguntaNormalizada.split(/\s+/);

  db.all(
    `SELECT id, pergunta, resposta, palavras_chave FROM perguntas`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Erro na consulta:", err);
        return res.status(500).json({ error: "Erro ao consultar banco." });
      }

      let melhorResposta = "Desculpe, não consegui entender sua pergunta.";
      let melhorPontuacao = 0;
      let melhorCorrespondencia = 0;

      console.log("Pergunta do usuário:", perguntaNormalizada);

      rows.forEach((row) => {
        const perguntaBanco = normalizarTexto(row.pergunta);
        const palavrasChave = row.palavras_chave
          .split(",")
          .map((p) => p.trim().toLowerCase());

        // Verifica se a pergunta do usuário corresponde exatamente a uma do banco
        if (perguntaBanco === perguntaNormalizada) {
          console.log("Correspondência exata encontrada:", row.pergunta);
          return res.json({ resposta: row.resposta });
        }

        // Calcula a pontuação das palavras-chave
        const pontuacao = palavrasChave.filter((palavra) =>
          palavrasUsuario.includes(palavra)
        ).length;

        // Calcula a similaridade baseada na contagem de palavras correspondentes
        const correspondencia = perguntaNormalizada
          .split(" ")
          .filter((palavra) => perguntaBanco.includes(palavra)).length;

        console.log(`Pergunta no banco: ${row.pergunta} | Pontuação: ${pontuacao} | Correspondência: ${correspondencia}`);

        // Atualiza a melhor resposta com base na pontuação e na correspondência
        if (
          pontuacao > melhorPontuacao ||
          (pontuacao === melhorPontuacao && correspondencia > melhorCorrespondencia)
        ) {
          melhorPontuacao = pontuacao;
          melhorCorrespondencia = correspondencia;
          melhorResposta = row.resposta;
        }
      });

      console.log("Melhor resposta escolhida:", melhorResposta);
      return res.json({
        resposta: melhorPontuacao > 0 ? melhorResposta : "Desculpe, não encontrei uma resposta exata.",
      });
    }
  );
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});