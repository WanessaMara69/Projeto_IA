function gerarConteudo(prompt) {
  console.log(prompt);
  const result = baseDeRespostas[prompt.toLowerCase()] || null;
  
  if (result) {
    console.log("Resposta da IA:", result);
    addMessage(result, "bot");
  } else {
    addMessage("Desculpe, não consegui entender sua pergunta.", "bot");
  }
}

async function perguntar() {
  const inputElement = document.getElementById("prompt");
  const prompt = inputElement.value.trim();
  if (!prompt) return;

  addMessage(prompt, "user");
  inputElement.value = "";  // Limpa o input imediatamente

  try {
    // Adicione um loader enquanto espera a resposta
    
    const resposta = await fetch("http://localhost:3000/perguntar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pergunta: prompt }),
    });

    if (!resposta.ok) {
      throw new Error(`Erro na API: ${resposta.status}`);
    }

    const data = await resposta.json();
    
    
    // Formata a resposta (mantenha seus links HTML se existirem)
    const respostaFormatada = data.resposta.includes("<a") 
      ? data.resposta 
      : formatText(data.resposta.replace(
          /(https?:\/\/[^\s]+)/g, '<a href="$&" target="_blank">$&</a>'
        ));

    addMessage(respostaFormatada, "bot");
    
  } catch (error) {
    console.error("Erro:", error);
    addMessage("Erro ao conectar com o servidor. Tente novamente.", "bot");
  }
}

// Modifique a função addMessage para retornar o elemento criado
function addMessage(text, sender) {
  const result = document.getElementById("result");
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  if (sender === "bot") {
    const avatar = document.createElement("img");
    avatar.classList.add("avatar");
    avatar.src = "img/marisol2.jpg";
    avatar.alt = "IA Marisol";
    messageDiv.appendChild(avatar);
  }

  const messageSpan = document.createElement("span");
  messageSpan.innerHTML = formatText(text);
  messageDiv.appendChild(messageSpan);

  result.appendChild(messageDiv);
  result.scrollTop = result.scrollHeight;
  
  return messageDiv;  // ← Retorna o elemento para poder removê-lo depois
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Negrito
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Itálico
    .replace(/\n/g, "<br>"); // Quebra de linha
}

function toggleChat() {
  const chatBox = document.querySelector(".chat-container");
  const chatButton = document.querySelector(".chat-button");
  const chatMessageContainer = document.querySelector(
    ".chat-message-container"
  );
  const result = document.getElementById("result");

  if (chatBox.style.display === "none" || chatBox.style.display === "") {
    chatBox.style.display = "flex"; // Mostra o chat
    chatBox.classList.add("show"); // Adiciona a classe de exibição
    chatMessageContainer.style.display = "none";

    // Exibe o conteúdo do chat
    result.style.display = "block";

    // Ajusta a posição do chat para sempre ficar no fundo à direita
    chatBox.style.position = "fixed";
    chatBox.style.right = "10px"; // Coloca o chat à direita
    chatBox.style.bottom = "20px"; // Coloca o chat na parte inferior
    

    // Ajusta a altura do chat com base no espaço disponível na tela
    if (parseInt(chatBox.style.bottom) + chatBox.offsetHeight > window.innerHeight) {
      chatBox.style.height = window.innerHeight - 100 + "px"; // Ajusta a altura para não ultrapassar a tela
    }
  } else {
    chatBox.style.display = "none"; // Esconde o chat
    chatBox.classList.remove("show");

    // Mostra novamente o botão e a mensagem
    chatMessageContainer.style.display = "flex";
    result.style.display = "none";

    // Reseta a posição do chat para o canto inferior direito
    chatBox.style.position = "fixed";
    chatBox.style.right = "10px";
    chatBox.style.bottom = "10px";
  }
}

// Aplica as funções quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  // Configura links do bot para ter cursor de pointer (seu código original)
  document.querySelectorAll(".message.bot a").forEach((link) => {
    link.style.cursor = "pointer";
  });

  // Adiciona envio com Enter ao textarea #prompt
  const inputField = document.querySelector("#prompt"); // Campo de texto
  const sendButton = document.querySelector(".input-container button"); // Botão de enviar

  if (inputField && sendButton) {
    inputField.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Evita quebra de linha
        sendButton.click(); // Chama a função perguntar() via clique
      }
    });
  }
});