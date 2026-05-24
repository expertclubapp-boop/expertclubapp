# Expert Club — Plano de PRs para Prescritores e Visualização do Aluno

**Status base do projeto:** QA interno controlado aprovado.  
**Não declarar:** Beta externo, Production Ready, pronto para escala ou app finalizado.  
**Foco desta fase:** prescritores de treino/dieta e experiência/visualização do aluno.

---

## 0. Regra-mãe da fase

O Expert Club agora deve ser tratado como produto **B2C low ticket operado pelo Admin/Ruben**, não como SaaS B2B multi-mentor.

O Admin deve ser o centro operacional:

- cria e mantém catálogos;
- monta treinos;
- monta dietas;
- atribui treino/dieta ao aluno;
- acompanha execução;
- revisa check-ins;
- ajusta prescrição;
- acompanha evolução.

O aluno deve perceber valor no app:

- sabe o que fazer hoje;
- entende treino e dieta;
- vê vídeos/instruções;
- registra cargas e refeições;
- vê evolução;
- recebe feedback;
- percebe que o acompanhamento está vivo.

---

## 1. Objetivo desta sequência de PRs

Transformar o Expert Club em uma plataforma operacional real para treino e dieta, com foco em:

1. **Prescritor de Treino V1**
2. **Execução de Treino Premium para Aluno**
3. **Histórico de Cargas e Progressão**
4. **Prescritor de Dieta V1**
5. **Visualização Premium da Dieta para Aluno**
6. **Substituições Alimentares Controladas**
7. **Evolução do Aluno**
8. **Polimento final de PT-BR e UX operacional**

---

## 2. O que NÃO entra agora

Não implementar nesta fase:

- IA gerando treino automaticamente;
- chat completo;
- manipulados/fitoterápicos;
- orçamento com farmácia;
- equivalentes avançados com desvio padrão;
- micronutrientes completos;
- 250 modelos genéricos de dieta;
- SaaS multi-mentor;
- workspaces;
- marketplace;
- app de terceiros;
- automações complexas;
- notificações push;
- refatoração visual global fora do escopo.

Essas coisas só entram depois do core estar sólido.

---

# Sequência Recomendada de PRs

## Visão geral

| Ordem | PR | Objetivo | Tipo |
|---:|---|---|---|
| 1 | Workout Exercise Library V1 | Fortalecer biblioteca de exercícios com vídeos, instruções e metadados | Treino/Admin |
| 2 | Workout Builder V1 | Criar/melhorar montagem rápida de treino por dias/exercícios | Treino/Admin |
| 3 | Workout Assignment UX Upgrade | Melhorar prescrição 1:1 com snapshot, motivo e preview | Treino/Admin |
| 4 | Student Workout Execution Premium | Melhorar tela do aluno para executar treino com clareza | Treino/Aluno |
| 5 | Workout Progression History | Histórico de cargas, reps, volume e últimas marcas | Treino/Admin+Aluno |
| 6 | Diet Food Library V1 | Banco de alimentos próprio com macros e medidas | Dieta/Admin |
| 7 | Diet Builder V1 | Montagem de dieta por refeições/alimentos/macros | Dieta/Admin |
| 8 | Student Diet Experience Premium | Visualização real da dieta pelo aluno | Dieta/Aluno |
| 9 | Controlled Food Substitutions V1 | Substituições reais aprovadas pelo Admin | Dieta/Admin+Aluno |
| 10 | Student Evolution Dashboard | Evolução de peso, fotos, check-ins, aderência e performance | Aluno/Admin |
| 11 | PT-BR Labels + Final Copy Sweep | Remover inglês e enums crus das telas principais | Qualidade |
| 12 | QA Final Prescritores + Student Experience | Auditoria final de ponta a ponta | QA |

---

# PR 1 — Workout Exercise Library V1

## Nome sugerido da branch

`codex/workout-exercise-library-v1`

## Objetivo

Criar ou fortalecer a biblioteca de exercícios usada pelo Admin para montar treinos e pelo aluno para executar com orientação clara.

A biblioteca precisa ter dados úteis, não só nome do exercício.

## Problema atual

Mesmo existindo catálogos/admin, a biblioteca precisa virar base operacional para prescrição:

- exercício com grupo muscular;
- equipamento;
- nível;
- vídeo demonstrativo;
- instruções;
- erros comuns;
- observações técnicas;
- status ativo/inativo;
- busca/filtro.

## Escopo

### Admin

Criar/ajustar tela de exercícios:

- `/admin/exercises`
- `/admin/exercises/new`
- `/admin/exercises/:id`

Campos mínimos:

```ts
type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles?: string[];
  equipment?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  thumbnailUrl?: string;
  instructions?: string[];
  commonMistakes?: string[];
  cues?: string[];
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

## Tarefas detalhadas

### 1. Auditar estrutura atual

Rodar:

```bash
grep -R "AdminExercises" -n src
grep -R "exercise" -n src/services src/screens src/types firestore.rules scripts
grep -R "videoUrl\|thumbnailUrl\|muscleGroup\|equipment" -n src
```

Mapear:

| Campo | Existe? | Onde é usado? | Gap |
|---|---|---|---|

### 2. Fortalecer schema/tipos

Criar/atualizar:

- `src/types/exercise.types.ts`
- ou arquivo equivalente já existente.

Garantir:

- sem `any`;
- sem `undefined` em payload;
- datas como Timestamp;
- campos opcionais realmente opcionais.

### 3. Service de exercícios

Criar/fortalecer:

- `src/services/adminExerciseService.ts`

Funções mínimas:

```ts
listExercises(filters?: {
  status?: 'active' | 'inactive' | 'all';
  muscleGroup?: string;
  search?: string;
  limit?: number;
}): Promise<Exercise[]>

getExercise(id: string): Promise<Exercise | null>

createExercise(input: ExerciseInput): Promise<string>

updateExercise(id: string, input: Partial<ExerciseInput>): Promise<void>

archiveExercise(id: string): Promise<void>
```

### 4. UI Admin

A tela `/admin/exercises` deve ter:

- busca;
- filtro por grupo muscular;
- filtro por equipamento;
- filtro por status;
- tabela/cards legíveis;
- botão criar exercício;
- badges PT-BR;
- ações funcionais.

Editor:

- nome;
- grupo muscular;
- músculos secundários;
- equipamento;
- nível;
- URL do vídeo;
- instruções;
- erros comuns;
- cues;
- status.

### 5. Validação de vídeo

Não precisa fazer upload de vídeo agora.

Permitido:

- aceitar URL externa;
- validar se parece URL;
- mostrar preview se possível;
- se não houver vídeo, mostrar estado honesto.

### 6. Rules

Verificar:

- Admin escreve;
- aluno lê exercícios ativos se necessário;
- aluno não escreve;
- affiliate não escreve.

Não alterar rules se já estiver correto.

### 7. QA

Validar:

- criar exercício;
- editar exercício;
- arquivar;
- listar;
- buscar;
- vídeo URL aparece;
- aluno consegue ver exercício no treino quando usado.

## Critérios de aceite

- Admin cria exercício real.
- Admin edita exercício.
- Admin arquiva exercício.
- Builder de treino consegue consumir a biblioteca.
- Aluno consegue ver nome/instrução/vídeo quando exercício aparece no treino.
- Sem `alert()`.
- Sem `window.confirm()`.
- Sem `href="#"`.
- Sem `any`.
- Sem `undefined` em Firestore.
- PT-BR aplicado.
- `typecheck`, `build`, `smoke:roles`, `test:rules`, `smoke:setup:dry` passam.

## Documentação

Atualizar/criar:

- `docs/qa/WORKOUT_EXERCISE_LIBRARY_REPORT.md`
- `docs/release/PROJECT_STATUS.md`
- `docs/qa/QA_INTERNO_CONTROLADO_REPORT.md`

## Veredito permitido

- `Workout Exercise Library V1 validado para QA interno controlado`
- `Parcial: biblioteca de exercícios ainda incompleta`
- `Bloqueado`

---

# PR 2 — Workout Builder V1

## Nome sugerido da branch

`codex/workout-builder-v1`

## Objetivo

Transformar o catálogo de treinos em um builder operacional para montagem rápida de treino.

O Admin precisa conseguir montar um treino real com dias, exercícios, séries, reps, descanso e observações.

## Problema atual

O sistema já possui templates/catálogos, mas a montagem precisa ficar mais operacional e amigável.

## Escopo

Rotas prováveis:

- `/admin/workouts`
- `/admin/workouts/new`
- `/admin/workouts/:id`

Schema mínimo:

```ts
type WorkoutTemplate = {
  id: string;
  title: string;
  goal: 'hypertrophy' | 'fat_loss' | 'strength' | 'health' | 'conditioning';
  level: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek?: number;
  estimatedDurationMin?: number;
  status: 'draft' | 'active' | 'archived';
  days: WorkoutDay[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type WorkoutDay = {
  id: string;
  title: string;
  order: number;
  focus?: string;
  exercises: WorkoutExercise[];
};

type WorkoutExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets: number;
  reps: string;
  restSeconds?: number;
  rir?: string;
  rpe?: string;
  tempo?: string;
  notes?: string;
};
```

## Tarefas detalhadas

### 1. Auditar estado atual

```bash
grep -R "AdminWorkout" -n src
grep -R "workoutTemplates\|workouts" -n src/services src/screens src/types scripts
grep -R "days" -n src/screens/admin src/services
grep -R "sets\|reps\|rest" -n src
```

### 2. Builder de dias

Implementar:

- adicionar dia;
- renomear dia;
- remover dia;
- ordenar dia, se simples;
- adicionar foco do dia.

### 3. Builder de exercícios

Implementar:

- buscar exercício da biblioteca;
- adicionar ao dia;
- remover do dia;
- alterar ordem;
- definir séries;
- reps;
- descanso;
- RIR/RPE opcional;
- observações.

### 4. Preview

Adicionar preview simples:

- dias;
- exercícios;
- volume total;
- duração estimada;
- número de exercícios.

### 5. Status do template

Estados:

- Rascunho;
- Ativo;
- Arquivado.

PT-BR na UI.

### 6. Validação de formulário

Não permitir salvar treino sem:

- título;
- pelo menos 1 dia;
- pelo menos 1 exercício;
- exercício com séries/reps válidos.

Erro deve ser inline/toast, não `alert`.

### 7. Integração com prescrição 1:1

O treino criado deve aparecer no seletor de `Admin Prescription Operations`.

## Critérios de aceite

- Admin cria treino real com dias e exercícios.
- Admin edita treino.
- Admin arquiva treino.
- Treino aparece para atribuição 1:1.
- Aluno recebe treino atribuído e consegue abrir.
- Sem campos `undefined`.
- Sem `as any`.
- Sem botão fake.
- Validações obrigatórias passam.

## Documentação

- `docs/qa/WORKOUT_BUILDER_V1_REPORT.md`
- atualizar `ADMIN_PRESCRIPTION_OPERATIONS_REPORT.md`
- atualizar `PROJECT_STATUS.md`

## Veredito permitido

- `Workout Builder V1 validado para QA interno controlado`
- `Parcial: builder de treino ainda incompleto`
- `Bloqueado`

---

# PR 3 — Workout Assignment UX Upgrade

## Nome sugerido da branch

`codex/workout-assignment-ux-upgrade`

## Objetivo

Melhorar a experiência de atribuição de treino dentro do Admin Student 360º.

Essa PR não cria o builder. Ela melhora o fluxo de prescrição 1:1.

## Escopo

Na aba `Treino` de `/admin/users/:id`:

- selecionar treino;
- ver preview antes de atribuir;
- motivo da troca;
- data efetiva;
- confirmação visual;
- histórico mais claro;
- feedback de sucesso/erro.

## Tarefas

### 1. Preview antes de atribuir

Ao selecionar treino, mostrar:

- título;
- objetivo;
- nível;
- dias;
- exercícios totais;
- duração estimada;
- observações.

### 2. Motivo obrigatório ou recomendado

Adicionar campo:

- “Motivo da prescrição/alteração”

Exemplos:

- “Início do protocolo”
- “Progressão de carga”
- “Troca de fase”
- “Redução de volume por fadiga”
- “Ajuste após check-in”

### 3. Histórico claro

Mostrar:

- treino ativo;
- treinos substituídos;
- data;
- quem atribuiu;
- motivo;
- snapshot.

### 4. Aluno vê atualização

Em `/app/workouts`:

- exibir “Treino atualizado em DD/MM”
- exibir “Plano atual”
- se houver histórico, mostrar o mais recente.

## Critérios

- Atribuição continua transacional.
- Histórico fica claro.
- Aluno vê atualização.
- Sem duplicar lógica.
- Sem criar treino fake.

---

# PR 4 — Student Workout Execution Premium

## Nome sugerido da branch

`codex/student-workout-execution-premium`

## Objetivo

Melhorar a experiência do aluno durante a execução do treino.

O aluno precisa abrir o treino e entender exatamente:

- qual exercício fazer;
- como executar;
- qual carga usou antes;
- o que registrar;
- progresso da sessão.

## Escopo

Rotas:

- `/app/workouts`
- `/app/workouts/:id`
- `/app/workouts/session/:id`

## Tarefas detalhadas

### 1. Tela de biblioteca de treinos do aluno

Mostrar:

- treino atual destacado;
- objetivo;
- nível;
- frequência;
- última atualização;
- CTA claro: “Iniciar treino”.

### 2. Tela de detalhe do treino

Mostrar:

- dias do treino;
- exercícios por dia;
- instruções;
- vídeos;
- tags de grupo muscular;
- duração estimada.

### 3. Tela de execução

Para cada exercício:

- nome;
- vídeo;
- instruções resumidas;
- séries planejadas;
- reps planejadas;
- descanso;
- carga anterior;
- melhor carga;
- campo para carga;
- campo para reps;
- checkbox/concluir série;
- observações.

### 4. UX durante treino

- progresso da sessão;
- exercício atual;
- próximo exercício;
- botão finalizar treino;
- salvar automático ou salvar claro;
- erro inline;
- estado offline, se não houver suporte, mostrar honestamente.

### 5. Vídeo

Se `videoUrl` existir:

- botão “Ver execução”;
- embed ou abrir modal;
- fallback se não houver vídeo.

### 6. Histórico rápido

Mostrar:

- “Última vez: 20kg x 12”
- “Melhor: 24kg x 10”
- “Volume anterior: X kg”

## Critérios de aceite

- Aluno executa treino completo sem confusão.
- Registra séries com carga/reps.
- Vê carga anterior.
- Vê vídeo/instruções.
- Conclui treino.
- Admin depois vê sessão no Student 360º.
- Sem campo `undefined`.
- Sem `alert`.
- Sem erro de console.

---

# PR 5 — Workout Progression History

## Nome sugerido da branch

`codex/workout-progression-history`

## Objetivo

Transformar execução de treino em dados úteis para ajuste.

## Escopo

### Para aluno

- histórico por exercício;
- evolução de carga;
- volume semanal;
- PR simples;
- últimas sessões.

### Para admin

No Student 360º:

- progresso por exercício;
- últimas cargas;
- melhor carga;
- aderência de treino;
- sessões concluídas.

## Tarefas

### 1. Criar service de progressão

Arquivo sugerido:

- `src/services/workoutProgressionService.ts`

Funções:

```ts
getStudentExerciseHistory(studentId: string, exerciseId: string)
getStudentWorkoutProgressSummary(studentId: string)
getRecentWorkoutPerformance(studentId: string)
```

### 2. Métricas simples

Calcular:

- última carga;
- melhor carga;
- melhor série;
- volume por sessão;
- volume 7d/30d;
- sessões concluídas.

### 3. UI aluno

Em `/app/workouts/session/:id`:

- mostrar última carga;
- melhor marca;
- sugestão visual: “tente manter ou progredir”.

Não sugerir carga automaticamente ainda.

### 4. UI admin

Em `/admin/users/:id`, aba Treino:

- cards de evolução;
- lista de exercícios com progressão;
- últimas sessões.

## Critérios

- Dados vêm de sessões reais.
- Não usa mock.
- Limits aplicados.
- Sem query global perigosa.
- Sem prometer IA.

---

# PR 6 — Diet Food Library V1

## Nome sugerido da branch

`codex/diet-food-library-v1`

## Objetivo

Criar/fortalecer banco de alimentos próprio, simples e confiável.

## Escopo

Rotas:

- `/admin/foods`
- `/admin/foods/new`
- `/admin/foods/:id`

Schema mínimo:

```ts
type Food = {
  id: string;
  name: string;
  category?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: number;
  servingUnit?: string;
  householdMeasure?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

## Tarefas

- criar alimento;
- editar alimento;
- arquivar;
- buscar;
- filtrar categoria;
- garantir macros numéricos;
- impedir `undefined`;
- medidas caseiras;
- foto URL opcional.

## Critérios

- Admin cria alimento real.
- Diet Builder consome alimentos.
- Aluno vê nome/gramatura/macros.
- Sem TBCA/Tucunduva agora.
- Sem importação massiva agora.

---

# PR 7 — Diet Builder V1

## Nome sugerido da branch

`codex/diet-builder-v1`

## Objetivo

Criar ou fortalecer builder de dieta por alimentos e refeições.

## Escopo

Rotas:

- `/admin/diets`
- `/admin/diets/new`
- `/admin/diets/:id`

Schema sugerido:

```ts
type DietTemplate = {
  id: string;
  title: string;
  goal?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: DietMeal[];
  status: 'draft' | 'active' | 'archived';
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

type DietMeal = {
  id: string;
  title: string;
  order: number;
  time?: string;
  notes?: string;
  items: DietMealItem[];
};

type DietMealItem = {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
};
```

## Tarefas

### 1. Builder de refeições

- adicionar refeição;
- editar nome;
- horário opcional;
- observações qualitativas.

### 2. Adicionar alimentos

- buscar alimento da biblioteca;
- definir quantidade;
- calcular macros proporcionalmente;
- permitir medida caseira;
- remover alimento.

### 3. Totais

Mostrar:

- kcal total;
- proteína;
- carbo;
- gordura;
- por refeição;
- por dieta.

### 4. Validação

Não salvar sem:

- título;
- pelo menos 1 refeição;
- pelo menos 1 alimento;
- macros válidos.

### 5. Integração com atribuição

Dieta criada aparece no Admin Student 360º para prescrição.

## Critérios

- Admin monta dieta completa.
- Admin atribui dieta.
- Aluno vê dieta real.
- BuildFromDiet funciona.
- Sem `totalKcal` divergente na raiz.
- Sem mock.

---

# PR 8 — Student Diet Experience Premium

## Nome sugerido da branch

`codex/student-diet-experience-premium`

## Objetivo

Melhorar a experiência do aluno com dieta.

## Escopo

Rotas:

- `/app/diets`
- `/app/diets/today`

## Tarefas

### 1. `/app/diets`

Mostrar:

- dieta atual;
- kcal/macros;
- última atualização;
- refeições;
- CTA “Ver dieta de hoje”.

### 2. `/app/diets/today`

Mostrar:

- resumo diário;
- refeições expansíveis;
- alimentos;
- gramatura;
- medidas caseiras;
- macros por refeição;
- progresso consumido;
- hidratação;
- metas qualitativas.

### 3. Marcação de item

- marcar alimento;
- desmarcar;
- recalcular consumo;
- persistir;
- refletir em `/app/today`.

### 4. Visual

- premium, legível;
- sem card vazio;
- sem mock;
- sem inglês cru.

## Critérios

- Aluno entende o que comer.
- Marca consumo.
- Vê progresso real.
- Sem `undefined`.
- Sem substituições fake.

---

# PR 9 — Controlled Food Substitutions V1

## Nome sugerido da branch

`codex/controlled-food-substitutions-v1`

## Objetivo

Permitir substituição alimentar real, aprovada pelo Admin, sem motor automático complexo.

## Escopo

### Admin

No Diet Builder:

- para cada item, permitir cadastrar alternativas;
- alternativa vem da Food Library;
- define quantidade;
- macros calculados;
- nota opcional.

### Aluno

Em `/app/diets/today`:

- botão “Substituir” só aparece se houver alternativas reais;
- modal lista alternativas;
- aluno escolhe;
- app recalcula macros;
- histórico registra substituição.

## Schema sugerido

```ts
type FoodSubstitutionOption = {
  id: string;
  originalMealItemId: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
};
```

## Regras

- Sem substituição livre.
- Sem IA.
- Sem “Opção A/B”.
- Sem alimento inexistente.
- Sem `foodId: undefined`.

## Critérios

- Admin cadastra alternativa real.
- Aluno troca por alternativa.
- Firestore salva substituição válida.
- Totais recalculam.
- Histórico mostra troca.

---

# PR 10 — Student Evolution Dashboard

## Nome sugerido da branch

`codex/student-evolution-dashboard`

## Objetivo

Criar uma visualização clara de evolução para o aluno e para o Admin.

## Escopo

Rotas possíveis:

- `/app/progress` ou dentro de `/app/profile`/`/app/today`
- `/admin/users/:id`, aba Evolução

## Dados

- peso;
- medidas;
- fotos;
- body check-ins;
- check-ins;
- treinos concluídos;
- carga evoluindo;
- aderência de dieta;
- hidratação.

## Tarefas

### Aluno

Mostrar:

- peso atual;
- evolução do peso;
- fotos de progresso, se existirem;
- treinos concluídos;
- aderência da semana;
- últimos check-ins.

### Admin

Mostrar:

- evolução corporal;
- aderência;
- check-ins;
- treino;
- dieta;
- alertas.

## Critérios

- Sem gráfico fake.
- Se não houver dado, empty state honesto.
- Dados com limit/recorte.
- PT-BR.

---

# PR 11 — PT-BR Labels + Final Copy Sweep

## Nome sugerido da branch

`codex/ptbr-labels-final-sweep`

## Objetivo

Remover inglês cru e enums expostos nas telas principais.

## Escopo

Buscar:

```bash
grep -R "Active\|Pending\|Completed\|Draft\|Published\|Hypertrophy\|Strength\|Beginner\|Advanced\|Workout\|Diet\|Check-in\|Settings\|Overview\|Dashboard\|Profile\|Billing\|Subscription" -n src
```

## Helpers

Expandir:

- `src/utils/labels.ts`

Funções:

```ts
statusPt()
rolePt()
goalPt()
levelPt()
assignmentStatusPt()
prescriptionTypePt()
checkinStatusPt()
checkinTypePt()
billingStatusPt()
workoutGoalPt()
dietGoalPt()
```

## Critérios

- Telas principais sem enum cru.
- PT-BR consistente.
- Sem tradução espalhada manualmente.
- Sem alterar valor salvo no banco.
- Apenas apresentação.

---

# PR 12 — QA Final Prescritores + Student Experience

## Nome sugerido da branch

`codex/prescription-student-experience-final-qa`

## Objetivo

Auditar tudo que foi implementado nos prescritores e visualização do aluno.

## Escopo de QA

### Admin

- cria exercício;
- cria treino;
- atribui treino;
- cria alimento;
- cria dieta;
- atribui dieta;
- cadastra substituições;
- vê histórico;
- vê progresso.

### Aluno

- vê treino;
- executa treino;
- registra carga;
- vê histórico;
- vê dieta;
- marca refeição;
- faz substituição;
- vê evolução;
- envia check-in;
- vê feedback.

## Validações obrigatórias

```bash
npm run typecheck
npm run build
npm run smoke:roles
npm run test:rules
npm run smoke:setup:dry
```

## Browser QA

Usuários:

- `admin@expertclub.test`
- `student@expertclub.test`

Rotas:

```txt
/admin/exercises
/admin/workouts
/admin/diets
/admin/foods
/admin/users/:id
/admin/checkins
/app/today
/app/workouts
/app/workouts/:id
/app/workouts/session/:id
/app/diets
/app/diets/today
/app/checkin/daily
/app/profile
```

## Screenshots

Criar:

```txt
qa/prescription-student-experience-final/
```

## Relatório

Criar:

```txt
docs/qa/PRESCRIPTION_STUDENT_EXPERIENCE_FINAL_QA.md
```

## Veredito permitido

- `Prescritores e visualização do aluno validados para QA interno controlado`
- `Parcial: ainda existem gaps operacionais`
- `Bloqueado`

---

# Ordem real de execução

Não execute tudo junto.

A ordem correta:

1. **PR 1 — Exercise Library**
2. **PR 2 — Workout Builder**
3. **PR 3 — Workout Assignment UX**
4. **PR 4 — Student Workout Execution**
5. **PR 5 — Workout Progression**
6. **PR 6 — Food Library**
7. **PR 7 — Diet Builder**
8. **PR 8 — Student Diet Experience**
9. **PR 9 — Food Substitutions**
10. **PR 10 — Evolution Dashboard**
11. **PR 11 — PT-BR Sweep**
12. **PR 12 — Final QA**

---

# Guardrails permanentes

Toda PR deve manter:

```bash
npm run typecheck
npm run build
npm run smoke:roles
npm run test:rules
npm run smoke:setup:dry
```

Nunca rodar sem autorização:

```bash
firebase deploy
npm run backfill:date-fields -- --apply
npm run qa:seed-users
npm run smoke:setup
```

Nunca declarar:

- Beta externo;
- Production Ready;
- pronto para escala;
- app finalizado.

---

# Critérios de qualidade para toda a fase

Toda tela precisa obedecer:

- sem `alert()`;
- sem `window.confirm()`;
- sem `href="#"`;
- sem `console.log` de produção;
- sem botão fake;
- sem mock visual parecendo dado real;
- sem `as any` para burlar tipo;
- sem `undefined` em Firestore;
- PT-BR na UI;
- status e enums traduzidos;
- empty state honesto;
- loading state;
- error state;
- actionability clara;
- dados reais ou disabled com motivo.

---

# Resumo brutal

Se tentar fazer treino, dieta, substituições, histórico, evolução e visual premium em uma PR só, vai dar ruim.

O caminho certo é construir camada por camada:

1. **Biblioteca**
2. **Builder**
3. **Atribuição**
4. **Execução**
5. **Histórico**
6. **Visualização**
7. **QA final**

O Expert Club não precisa de IA agora.  
Precisa de prescrição real, execução clara e acompanhamento de evolução.
