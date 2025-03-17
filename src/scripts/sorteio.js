class TeamDistributor {
    constructor(players, teamCount, playersPerTeam) {
        this.players = players;
        this.teamCount = teamCount;
        this.playersPerTeam = playersPerTeam;
        // Adicionar seed aleatório para garantir distribuições diferentes
        this.seed = Math.random();
    }

    // Classificar os jogadores por gênero (primeiro as mulheres) e depois por pontuação
    sortPlayers() {
        return [...this.players].sort((a, b) => {
            // Primeiro, classificar por gênero (assumindo que "mulheres" vem antes de "homens")
            if (a.genre !== b.genre) {
                return a.genre.localeCompare(b.genre);
            }
            // Em seguida, classificar por pontuação em ordem decrescente
            return b.score - a.score;
        });
    }

    // Embaralhar completamente a ordem dos jogadores
    shufflePlayers(players) {
        const shuffled = [...players];
        
        // Algoritmo de Fisher-Yates para embaralhar
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }

    // Distribuir jogadores para equipes usando um algoritmo de balanceamento aprimorado
    distributeTeams() {
        // Ordenar jogadores por gênero e habilidade
        const sortedPlayers = this.sortPlayers();
        
        // Inicializar times vazios
        const teams = Array.from({ length: this.teamCount }, () => []);
        
        // MÉTODO 1: DISTRIBUIÇÃO SERPENTINA PARA OS MELHORES JOGADORES
        // Essa técnica coloca os melhores jogadores em times diferentes,
        // garantindo que a distribuição inicial seja equilibrada
        
        // Vamos pegar os melhores jogadores de cada gênero primeiro
        // (geralmente são os de maior impacto no jogo)
        const topPlayers = sortedPlayers.slice(0, this.teamCount * 2); // Top N*2 jogadores
        const remainingPlayers = sortedPlayers.slice(this.teamCount * 2);
        
        // Distribuir os melhores jogadores em formato serpentina
        // (1,2,3,...,N,N,...,3,2,1,1,...)
        let direction = 1; // 1 para crescente, -1 para decrescente
        let currentIndex = 0;
        
        for (let i = 0; i < topPlayers.length; i++) {
            teams[currentIndex].push(topPlayers[i]);
            
            // Calcular próximo índice
            currentIndex += direction;
            
            // Mudar direção quando alcançar os limites
            if (currentIndex >= this.teamCount - 1 || currentIndex <= 0) {
                direction *= -1;
            }
        }
        
        // MÉTODO 2: DISTRIBUIÇÃO GANANCIOSA PARA OS DEMAIS JOGADORES
        // Agora distribuir os demais jogadores usando o método de balanceamento
        // que sempre pega o time com menor pontuação total
        
        // Primeiro, vamos embaralhar os jogadores restantes para adicionar aleatoriedade
        const shuffledRemaining = this.shufflePlayers(remainingPlayers);
        
        for (let i = 0; i < shuffledRemaining.length; i++) {
            // Calcular pontuações atuais dos times
            const teamScores = teams.map(team => 
                team.reduce((sum, p) => sum + p.score, 0)
            );
            
            // Encontrar times com menor pontuação
            const minScore = Math.min(...teamScores);
            const teamsWithMinScore = teamScores
                .map((score, index) => ({ score, index }))
                .filter(team => team.score === minScore)
                .map(team => team.index);
            
            // Se temos vários times com a mesma pontuação mínima, escolher um aleatoriamente
            const randomIndex = Math.floor(Math.random() * teamsWithMinScore.length);
            const selectedTeam = teamsWithMinScore[randomIndex];
            
            // Adicionar jogador ao time selecionado
            teams[selectedTeam].push(shuffledRemaining[i]);
        }
        
        // MÉTODO 3: EQUALIZAÇÃO FINAL - verificação final do balanceamento
        // Verificar se podemos melhorar o balanceamento trocando jogadores
        this.optimizeTeamBalance(teams);
        
        return teams;
    }
    
    // Método para otimizar o balanceamento final de times
    optimizeTeamBalance(teams) {
        // Número de tentativas de otimização
        const MAX_ATTEMPTS = 100;
        
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            // Calcular pontuações atuais
            const teamScores = teams.map(team => 
                team.reduce((sum, p) => sum + p.score, 0)
            );
            
            // Encontrar time com maior e menor pontuação
            const maxScore = Math.max(...teamScores);
            const minScore = Math.min(...teamScores);
            
            // Se a diferença for pequena, já está bem equilibrado
            if (maxScore - minScore <= 2) {
                break;
            }
            
            const maxTeamIndex = teamScores.indexOf(maxScore);
            const minTeamIndex = teamScores.indexOf(minScore);
            
            // Tentar encontrar um par de jogadores que melhore o balanceamento
            let bestSwap = null;
            let bestImprovement = 0;
            
            // Para cada jogador no time com maior pontuação
            for (let i = 0; i < teams[maxTeamIndex].length; i++) {
                const playerFromMax = teams[maxTeamIndex][i];
                
                // Para cada jogador no time com menor pontuação
                for (let j = 0; j < teams[minTeamIndex].length; j++) {
                    const playerFromMin = teams[minTeamIndex][j];
                    
                    // Calcular o efeito da troca no balanceamento
                    const scoreDiff = playerFromMax.score - playerFromMin.score;
                    
                    // Se a troca melhorar o balanceamento
                    if (scoreDiff > 0 && scoreDiff < maxScore - minScore) {
                        const improvement = scoreDiff;
                        
                        if (improvement > bestImprovement) {
                            bestImprovement = improvement;
                            bestSwap = { maxIdx: i, minIdx: j };
                        }
                    }
                }
            }
            
            // Se encontramos uma troca que melhora o balanceamento, faça-a
            if (bestSwap) {
                const temp = teams[maxTeamIndex][bestSwap.maxIdx];
                teams[maxTeamIndex][bestSwap.maxIdx] = teams[minTeamIndex][bestSwap.minIdx];
                teams[minTeamIndex][bestSwap.minIdx] = temp;
            } else {
                // Se não encontramos uma troca melhor, paramos
                break;
            }
        }
    }

    // Calcular a pontuação total da equipe
    calculateTeamScores(teams) {
        return teams.map(team => 
            team.reduce((sum, player) => sum + player.score, 0)
        );
    }

    // Método principal para criar equipes
    createTeams() {
        // Validar entrada
        if (this.players.length < this.teamCount * this.playersPerTeam) {
            throw new Error('Não há jogadores suficientes para criar o número especificado de equipes');
        }

        // Distribuir equipes
        const teams = this.distributeTeams();

        // Calcular pontuações de equipe
        const teamScores = this.calculateTeamScores(teams);

        // Calcular estatísticas sobre o balanceamento
        const avgScore = teamScores.reduce((sum, score) => sum + score, 0) / teamScores.length;
        const maxScore = Math.max(...teamScores);
        const minScore = Math.min(...teamScores);
        const balanceStats = {
            average: avgScore,
            max: maxScore,
            min: minScore,
            difference: maxScore - minScore,
            standardDeviation: Math.sqrt(
                teamScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / teamScores.length
            )
        };

        return {
            teams,
            teamScores,
            balanceStats,
            timestamp: new Date().getTime()
        };
    }
}


let contadorJogadores = 1;

function atualizarNumeracao() {
    const jogadores = document.querySelectorAll(".jogador span");
    jogadores.forEach((span, index) => {
        span.textContent = `${index + 1}.`;
    });
    contadorJogadores = jogadores.length + 1;
}

function adicionarJogador(nome = "") {
    const container = document.getElementById("jogadoresContainer");
    const div = document.createElement("div");
    div.classList.add("jogador");
    div.innerHTML = `
        <span>${contadorJogadores}</span>
        <input type="text" placeholder="Nome" value="${nome}" required>
        <input id="inpnumb" type="number" placeholder="Habilidade" min="1" max="10" required>
        <select>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
        </select>
        <button style="background-color: rgb(253, 23, 23); color: #ffffff; border: none;" onclick="removerJogador(this)">X</button>
    `;
    container.appendChild(div);
    contadorJogadores++;
}

function adicionarListaJogadores() {
    const lista = document.getElementById("listaJogadores").value.split(",");
    lista.forEach(nome => {
        if (nome.trim()) {
            adicionarJogador(nome.trim());
        }
    });
    document.getElementById("listaJogadores").value = "";
}

function removerJogador(button) {
    button.parentElement.remove();
    atualizarNumeracao();
}

// Variável global para armazenar o último resultado
let ultimoResultado = null;
// Variável para armazenar o timestamp do último sorteio
let ultimoSorteioTimestamp = 0;

function sortearTimes() {
    const jogadores = Array.from(document.querySelectorAll(".jogador"))
        .map(jogador => {
            const inputs = jogador.querySelectorAll("input, select");
            return { 
                name: inputs[0].value, 
                score: parseInt(inputs[1].value), 
                genre: inputs[2].value,
                // Adicionar ID aleatório para cada jogador para garantir unicidade
                id: Math.random().toString(36).substr(2, 9)
            };
        })
        .filter(j => j.name && j.score);

    const numTimes = parseInt(document.getElementById("numTimes").value);
    const jogadoresPorTime = parseInt(document.getElementById("jogadoresPorTime").value);

    // Validar entrada
    if (jogadores.length < numTimes) {
        alert("Erro: Não há jogadores suficientes para formar os times.");
        return;
    }

    // Criar nova instância a cada vez para garantir aleatoriedade
    const distribuidor = new TeamDistributor(jogadores, numTimes, jogadoresPorTime);
    
    try {
        // Armazenar resultado para compartilhamento posterior
        ultimoResultado = distribuidor.createTeams();
        ultimoSorteioTimestamp = ultimoResultado.timestamp;

        console.log("Novo sorteio gerado com timestamp:", ultimoSorteioTimestamp);
        console.log("Estatísticas de balanceamento:", ultimoResultado.balanceStats);
        
        exibirTimes(ultimoResultado.teams, ultimoResultado.balanceStats);
        
        // Mostrar o botão de compartilhamento após o sorteio
        const btnCompartilhar = document.getElementById("btnCompartilhar");
        if (btnCompartilhar) {
            btnCompartilhar.style.display = "inline-block";
        } else {
            const resultDiv = document.getElementById("result");
            const compartilharBtn = document.createElement("button");
            compartilharBtn.id = "btnCompartilhar";
            compartilharBtn.textContent = "Compartilhar Times";
            compartilharBtn.onclick = compartilharTimes;
            compartilharBtn.style.marginTop = "10px";
            resultDiv.after(compartilharBtn);
        }
        
        alert("Sorteio realizado com sucesso!");
    } catch (error) {
        alert("Erro ao sortear times: " + error.message);
    }
}

function exibirTimes(times, balanceStats) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";
    
    // Adicionar estatísticas de balanceamento
    const statsDiv = document.createElement("div");
    statsDiv.classList.add("balance-stats");
    statsDiv.innerHTML = `
        <h3>Estatísticas de Balanceamento</h3>
        <p>Pontuação média: ${balanceStats.average.toFixed(1)}</p>
        <p>Diferença máx-mín: ${balanceStats.difference.toFixed(1)}</p>
        <p>Desvio padrão: ${balanceStats.standardDeviation.toFixed(2)}</p>
    `;
    resultDiv.appendChild(statsDiv);
    
    // Criar container para times
    const teamsContainer = document.createElement("div");
    teamsContainer.classList.add("teams-container");
    teamsContainer.style.display = "flex";
    teamsContainer.style.flexWrap = "wrap";
    teamsContainer.style.gap = "10px";
    teamsContainer.style.justifyContent = "center";
    resultDiv.appendChild(teamsContainer);
    
    times.forEach((time, i) => {
        let teamDiv = document.createElement("div");
        teamDiv.classList.add("team");
        teamDiv.style.border = "1px solid #ccc";
        teamDiv.style.borderRadius = "5px";
        teamDiv.style.padding = "10px";
        teamDiv.style.margin = "5px";
        teamDiv.style.flex = "1";
        teamDiv.style.minWidth = "250px";
        teamDiv.style.maxWidth = "300px";
        
        // Calcular a pontuação total da equipe
        const pontuacaoTotal = time.reduce((total, jogador) => total + jogador.score, 0);
        
        // Definir cor de fundo baseada no quão próximo está da média
        const colorIntensity = Math.min(100, Math.abs(pontuacaoTotal - balanceStats.average) * 10);
        const backgroundColor = pontuacaoTotal >= balanceStats.average ? 
            `rgba(200, 255, 200, ${colorIntensity/100})` : 
            `rgba(255, 200, 200, ${colorIntensity/100})`;
        
        teamDiv.style.backgroundColor = backgroundColor;
        
        teamDiv.innerHTML = `
            <h3>Time ${i + 1} (Pontuação: ${pontuacaoTotal})</h3>
            <ul style="list-style-type: none; padding-left: 0;">
                ${time.map(j => `
                    <li style="margin-bottom: 5px; padding: 5px; background-color: rgba(0,0,0,0.05); border-radius: 3px;">
                        <strong>${j.name}</strong> - ${j.score} pts
                        <small>(${j.genre === 'F' ? 'Feminino' : 'Masculino'})</small>
                    </li>
                `).join("")}
            </ul>
        `;
        
        teamsContainer.appendChild(teamDiv);
    });
    
    // Adicionar informação de timestamp para debug
    const timestampDiv = document.createElement("div");
    timestampDiv.style.fontSize = "10px";
    timestampDiv.style.color = "#999";
    timestampDiv.style.marginTop = "20px";
    timestampDiv.textContent = `Sorteio realizado em: ${new Date(ultimoSorteioTimestamp).toLocaleTimeString()}`;
    resultDiv.appendChild(timestampDiv);
}

function limparTimes() {
    document.getElementById("result").innerHTML = "";
    
    // Esconder o botão de compartilhamento
    const btnCompartilhar = document.getElementById("btnCompartilhar");
    if (btnCompartilhar) {
        btnCompartilhar.style.display = "none";
    }
    
    // Limpar o resultado anterior
    ultimoResultado = null;
    
    alert("Lista de times limpa!");
}

function compartilharTimes() {
    if (!ultimoResultado || !ultimoResultado.teams) {
        alert("Não há times para compartilhar. Por favor, realize um sorteio primeiro.");
        return;
    }
    
    // Preparar o texto para compartilhamento
    let textoCompartilhamento = "🏆 TIMES SORTEADOS 🏆\n\n";
    
    // Adicionar estatísticas de balanceamento
    textoCompartilhamento += `Balanceamento: Média ${ultimoResultado.balanceStats.average.toFixed(1)} | Diferença ${ultimoResultado.balanceStats.difference.toFixed(1)}\n\n`;
    
    ultimoResultado.teams.forEach((time, i) => {
        const pontuacaoTotal = time.reduce((total, jogador) => total + jogador.score, 0);
        
        textoCompartilhamento += `👥 TIME ${i + 1} (Pontuação: ${pontuacaoTotal}) 👥\n`;
        time.forEach(jogador => {
            textoCompartilhamento += `• ${jogador.name} (${jogador.score}) - ${jogador.genre === 'F' ? 'F' : 'M'}\n`;
        });
        textoCompartilhamento += "\n";
    });
    
    // Tentar compartilhar via Web Share API (compatível com dispositivos móveis)
    if (navigator.share) {
        navigator.share({
            title: 'Times Sorteados',
            text: textoCompartilhamento
        })
        .catch(error => {
            compartilharFallback(textoCompartilhamento);
        });
    } else {
        compartilharFallback(textoCompartilhamento);
    }
}

function compartilharFallback(texto) {
    // Criar um elemento de texto temporário
    const tempElement = document.createElement('textarea');
    tempElement.value = texto;
    document.body.appendChild(tempElement);
    
    // Selecionar e copiar o texto
    tempElement.select();
    document.execCommand('copy');
    
    // Remover o elemento temporário
    document.body.removeChild(tempElement);
    
    // Criar links para compartilhamento direto
    const modalDiv = document.createElement('div');
    modalDiv.style.position = 'fixed';
    modalDiv.style.top = '0';
    modalDiv.style.left = '0';
    modalDiv.style.width = '100%';
    modalDiv.style.height = '100%';
    modalDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modalDiv.style.display = 'flex';
    modalDiv.style.flexDirection = 'column';
    modalDiv.style.justifyContent = 'center';
    modalDiv.style.alignItems = 'center';
    modalDiv.style.zIndex = '1000';
    
    const contentDiv = document.createElement('div');
    contentDiv.style.backgroundColor = 'white';
    contentDiv.style.padding = '20px';
    contentDiv.style.borderRadius = '10px';
    contentDiv.style.maxWidth = '90%';
    contentDiv.style.maxHeight = '90%';
    contentDiv.style.overflow = 'auto';
    
    contentDiv.innerHTML = `
        <h3>Compartilhar Times</h3>
        <p>O texto foi copiado para sua área de transferência!</p>
        <p>Escolha um método para compartilhar:</p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
            <a href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" style="text-decoration: none;">
                <button style="background-color: #25D366; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                    WhatsApp
                </button>
            </a>
            <a href="mailto:?subject=Times Sorteados&body=${encodeURIComponent(texto)}" style="text-decoration: none;">
                <button style="background-color: #DB4437; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                    Email
                </button>
            </a>
            <button onclick="this.parentNode.parentNode.parentNode.remove()" style="background-color: #888; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer;">
                Fechar
            </button>
        </div>
    `;
    
    modalDiv.appendChild(contentDiv);
    document.body.appendChild(modalDiv);
    
    modalDiv.addEventListener('click', function(e) {
        if (e.target === modalDiv) {
            modalDiv.remove();
        }
    });
}