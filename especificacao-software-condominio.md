# Especificação de Software - Gestão Financeira de Condomínio

## Origem

Planilha Google Sheets do Condomínio José Marcolini.

A planilha contém abas mensais de dois tipos:

- `TAXA - [MÊS/ANO]`: cobrança mensal por apartamento.
- `Prestação - [MÊS/ANO]`: prestação de contas mensal do condomínio.

Também existem abas de modelo:

- `Exemplo Taxa`
- `Exemplo Prestação`

## Objetivo do Software

Criar um sistema para substituir a planilha mensal do condomínio, permitindo:

- Cadastrar apartamentos.
- Registrar taxas mensais de condomínio.
- Registrar taxa extra ou fundo de manutenção.
- Registrar leituras de gás por apartamento.
- Calcular automaticamente consumo, valor do gás e total a pagar.
- Gerar cobrança mensal por unidade.
- Controlar receitas, despesas, inadimplência e saldos.
- Gerar prestação de contas mensal.
- Manter histórico por mês e ano.
- Emitir relatórios para moradores e síndica.

## Contexto Principal

O condomínio possui 9 apartamentos:

| Apartamento |
|---|
| 101 |
| 102 |
| 103 |
| 201 |
| 202 |
| 203 |
| 301 |
| 302 |
| 303 |

## Módulos do Sistema

## 1. Cadastro do Condomínio

### Campos

| Campo | Tipo | Obrigatório | Observações |
|---|---:|---:|---|
| Nome do condomínio | Texto | Sim | Exemplo: Condomínio José Marcolini |
| CNPJ PIX | Texto | Sim | Usado nas instruções de pagamento |
| Texto padrão de cobrança | Texto longo | Não | Exemplo: Fazer o depósito na conta do condomínio até dia X |
| Texto padrão de fundo de obras | Texto longo | Não | Exemplo: pagamento de R$100,00 referente ao fundo de obras |
| Síndica/responsável | Texto | Não | Usado em relatórios impressos |

## 2. Cadastro de Apartamentos

### Campos

| Campo | Tipo | Obrigatório | Observações |
|---|---:|---:|---|
| Número do apartamento | Número ou texto | Sim | Exemplo: 101 |
| Morador | Texto | Não | Não consta na planilha atual, mas é recomendável |
| Proprietário | Texto | Não | Útil para fundo de obras |
| Status | Enum | Sim | Ativo, inativo |

## 3. Cobrança Mensal

Representa a aba `TAXA - [MÊS/ANO]`.

### Campos da Cobrança

| Campo | Tipo | Obrigatório | Exemplo |
|---|---:|---:|---|
| Mês de referência | Mês/Ano | Sim | Junho de 2026 |
| Data limite de pagamento | Data | Sim | 06/07/2026 |
| Valor da taxa de condomínio | Moeda | Sim | R$ 393,00 |
| Valor da taxa extra | Moeda | Não | R$ 10,00 |
| Valor do gás por m³ | Moeda | Sim | R$ 21,50 |
| Observações da cobrança | Texto longo | Não | Instruções de PIX e fundo de obras |

### Itens da Cobrança por Apartamento

| Campo | Tipo | Obrigatório | Regra |
|---|---:|---:|---|
| Apartamento | Referência | Sim | Selecionado do cadastro de apartamentos |
| Taxa de condomínio | Moeda | Sim | Pode vir do valor padrão do mês |
| Taxa extra | Moeda | Não | Pode ser zero |
| Leitura anterior do gás | Número | Sim | Valor acumulado do medidor |
| Leitura atual do gás | Número | Sim | Valor acumulado do medidor |
| Consumo de gás | Número | Sim | Calculado automaticamente |
| Preço por m³ | Moeda | Sim | Valor padrão do mês, salvo exceção |
| Valor do gás | Moeda | Sim | Calculado automaticamente |
| Total a pagar | Moeda | Sim | Calculado automaticamente |

### Regras de Cálculo

#### Consumo de gás

```text
consumo_gas = leitura_atual - leitura_anterior
```

Exemplo:

```text
Apartamento 102:
leitura_anterior = 3265
leitura_atual = 3269
consumo_gas = 4
```

#### Preço do gás

Na planilha, quando o consumo é zero, o preço por m³ é gravado como zero.

```text
se consumo_gas = 0:
    preco_gas_m3 = 0
senão:
    preco_gas_m3 = preço padrão do mês
```

Exemplo do mês Junho de 2026:

```text
preco_padrao_gas_m3 = R$ 21,50
```

#### Valor do gás

```text
valor_gas = consumo_gas * preco_gas_m3
```

Exemplo:

```text
Apartamento 303:
consumo_gas = 3
preco_gas_m3 = R$ 21,50
valor_gas = R$ 64,50
```

#### Total a pagar

```text
total_a_pagar = taxa_condominio + taxa_extra + valor_gas
```

Exemplo:

```text
Apartamento 101:
taxa_condominio = R$ 393,00
taxa_extra = R$ 10,00
valor_gas = R$ 21,50
total_a_pagar = R$ 424,50
```

### Exemplo de Cobrança - Junho de 2026

| Apto | Taxa condomínio | Taxa extra | Leitura anterior | Leitura atual | Consumo | Preço m³ | Valor gás | Total |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 101 | R$ 393,00 | R$ 10,00 | 1342 | 1343 | 1 | R$ 21,50 | R$ 21,50 | R$ 424,50 |
| 102 | R$ 393,00 | R$ 10,00 | 3265 | 3269 | 4 | R$ 21,50 | R$ 86,00 | R$ 489,00 |
| 103 | R$ 393,00 | R$ 10,00 | 0 | 0 | 0 | R$ 0,00 | R$ 0,00 | R$ 403,00 |
| 201 | R$ 393,00 | R$ 10,00 | 683 | 684 | 1 | R$ 21,50 | R$ 21,50 | R$ 424,50 |
| 202 | R$ 393,00 | R$ 10,00 | 1406 | 1407 | 1 | R$ 21,50 | R$ 21,50 | R$ 424,50 |
| 203 | R$ 393,00 | R$ 10,00 | 611 | 612 | 1 | R$ 21,50 | R$ 21,50 | R$ 424,50 |
| 301 | R$ 393,00 | R$ 10,00 | 1204 | 1206 | 2 | R$ 21,50 | R$ 43,00 | R$ 446,00 |
| 302 | R$ 393,00 | R$ 10,00 | 1703 | 1704 | 1 | R$ 21,50 | R$ 21,50 | R$ 424,50 |
| 303 | R$ 393,00 | R$ 10,00 | 1352 | 1355 | 3 | R$ 21,50 | R$ 64,50 | R$ 467,50 |
| **Totais** | **R$ 3.537,00** | **R$ 90,00** |  |  | **14** |  | **R$ 301,00** | **R$ 3.928,00** |

## 4. Prestação de Contas

Representa a aba `Prestação - [MÊS/ANO]`.

### Campos da Prestação

| Campo | Tipo | Obrigatório | Observações |
|---|---:|---:|---|
| Mês de referência | Mês/Ano | Sim | Exemplo: Junho de 2026 |
| Saldo do mês anterior | Moeda | Sim | Pode vir automaticamente do mês anterior |
| Receitas | Lista | Sim | Taxas, atrasados, pagamentos recebidos |
| Despesas | Lista | Sim | Contas e serviços pagos |
| Condomínios em atraso | Lista | Não | Mês e valor em aberto |
| Reserva para gás | Lista | Não | Saldo, entrada e compra |
| Conta corrente | Lista | Não | Saldo e movimentações |
| Conta poupança | Lista | Não | Saldo e depósitos |

### Receitas

| Campo | Tipo | Obrigatório | Exemplo |
|---|---:|---:|---|
| Descrição | Texto | Sim | Taxa de condomínio |
| Valor | Moeda | Sim | R$ 3.537,00 |
| Origem automática | Booleano | Não | Exemplo: total da aba de cobrança |

Receitas identificadas na planilha:

| Descrição | Origem |
|---|---|
| Saldo mês anterior | Prestação do mês anterior |
| Condomínio atrasado | Lançamento manual |
| Condomínio atrasado pago | Lançamento manual |
| Taxa de condomínio | Total da cobrança mensal |
| Taxa extra | Total da cobrança mensal |

### Despesas

| Campo | Tipo | Obrigatório | Exemplo |
|---|---:|---:|---|
| Descrição | Texto | Sim | CEMIG |
| Valor | Moeda | Sim | R$ 284,22 |
| Data de pagamento | Data | Não | Recomendável para o software |
| Categoria | Enum | Não | Energia, água, serviço, banco, manutenção |

Despesas identificadas na planilha:

| Descrição |
|---|
| CEMIG |
| COPASA |
| Conservadora Metódica |
| GPS |
| Tarifa bancária |
| Lâmpadas |
| Lâmpadas Leroy |

### Regras de Cálculo da Prestação

#### Total de receitas

```text
total_receitas = soma(receitas)
```

#### Total de despesas

```text
total_despesas = soma(despesas)
```

#### Crédito do mês

Na planilha, o crédito do mês é a diferença entre receitas e despesas.

```text
credito_do_mes = total_receitas - total_despesas
```

Exemplo de Junho de 2026:

```text
total_receitas = R$ 3.332,63
total_despesas = R$ 3.536,50
credito_do_mes = -R$ 203,87
```

#### Total de condomínios em atraso

```text
total_atrasos = soma(valores_em_atraso)
```

Exemplo de Junho de 2026:

```text
Maio = R$ 440,85
Junho = R$ 468,56
total_atrasos = R$ 909,41
```

#### Reserva para gás

```text
saldo_reserva_gas = saldo_anterior + entrada_gas - compras_gas
```

Exemplo de Junho de 2026:

```text
saldo_anterior = R$ 1.518,12
entrada_gas = R$ 301,00
compra = -R$ 1.290,00
saldo_reserva_gas = R$ 529,12
```

#### Conta corrente

```text
saldo_conta_corrente = saldo_anterior + movimentacoes_do_mes
```

Exemplo de Junho de 2026:

```text
saldo_anterior = R$ 3.267,87
transferencia_poupanca = -R$ 900,00
saldo_conta_corrente = R$ 2.367,87
```

#### Conta poupança

```text
saldo_poupanca = saldo_anterior + depositos - retiradas
```

Exemplo de Junho de 2026:

```text
saldo_anterior = R$ 12.203,95
deposito = R$ 900,00
saldo_poupanca = R$ 13.103,95
```

## 5. Inadimplência

### Campos

| Campo | Tipo | Obrigatório | Observações |
|---|---:|---:|---|
| Apartamento | Referência | Sim | Apartamento inadimplente |
| Mês de referência | Mês/Ano | Sim | Mês da cobrança |
| Valor original | Moeda | Sim | Total devido |
| Valor pago | Moeda | Não | Parcial ou total |
| Valor em aberto | Moeda | Sim | Calculado |
| Status | Enum | Sim | Em aberto, pago parcial, pago |
| Data do pagamento | Data | Não | Quando quitado |
| Observações | Texto | Não | Acordos ou justificativas |

### Regras

```text
valor_em_aberto = valor_original - valor_pago
```

Um pagamento em atraso quitado deve aparecer como receita na prestação de contas do mês em que foi recebido.

## 6. Telas Recomendadas

## Dashboard

Mostrar:

- Mês atual.
- Total previsto de cobrança.
- Total recebido.
- Total em atraso.
- Total de despesas.
- Crédito ou déficit do mês.
- Saldo da reserva para gás.
- Saldo da conta corrente.
- Saldo da poupança.

## Apartamentos

Funcionalidades:

- Listar apartamentos.
- Cadastrar ou editar morador/proprietário.
- Ver histórico de cobranças por apartamento.
- Ver histórico de consumo de gás.
- Ver pendências.

## Cobranças Mensais

Funcionalidades:

- Criar cobrança de um novo mês.
- Copiar dados do mês anterior.
- Informar leituras atuais de gás.
- Calcular consumo automaticamente.
- Calcular total por apartamento.
- Marcar cobrança como paga.
- Gerar demonstrativo individual.
- Gerar relatório geral do mês.

## Prestação de Contas

Funcionalidades:

- Criar prestação de contas do mês.
- Importar automaticamente total da taxa de condomínio.
- Importar automaticamente total da taxa extra.
- Importar automaticamente valor reservado para gás.
- Lançar despesas.
- Lançar valores em atraso.
- Calcular crédito ou déficit do mês.
- Atualizar saldos de reserva, conta corrente e poupança.
- Gerar relatório para impressão ou PDF.

## Relatórios

Relatórios esperados:

- Cobrança mensal por apartamento.
- Relatório geral da cobrança do mês.
- Prestação de contas mensal.
- Histórico de consumo de gás.
- Histórico de inadimplência.
- Histórico de receitas e despesas.
- Relatório anual consolidado.

## 7. Modelo de Dados Sugerido

## Tabela `condominios`

| Campo | Tipo |
|---|---|
| id | UUID |
| nome | Texto |
| cnpj_pix | Texto |
| responsavel | Texto |
| texto_padrao_cobranca | Texto |
| texto_padrao_fundo_obras | Texto |

## Tabela `apartamentos`

| Campo | Tipo |
|---|---|
| id | UUID |
| condominio_id | UUID |
| numero | Texto |
| morador | Texto |
| proprietario | Texto |
| ativo | Booleano |

## Tabela `cobrancas_mensais`

| Campo | Tipo |
|---|---|
| id | UUID |
| condominio_id | UUID |
| mes_referencia | Data |
| data_vencimento | Data |
| taxa_condominio_padrao | Decimal |
| taxa_extra_padrao | Decimal |
| preco_gas_m3_padrao | Decimal |
| observacoes | Texto |
| status | Enum |

## Tabela `cobranca_itens`

| Campo | Tipo |
|---|---|
| id | UUID |
| cobranca_mensal_id | UUID |
| apartamento_id | UUID |
| taxa_condominio | Decimal |
| taxa_extra | Decimal |
| leitura_anterior_gas | Decimal |
| leitura_atual_gas | Decimal |
| consumo_gas | Decimal |
| preco_gas_m3 | Decimal |
| valor_gas | Decimal |
| total_a_pagar | Decimal |
| valor_pago | Decimal |
| status_pagamento | Enum |
| data_pagamento | Data |

## Tabela `prestacoes_contas`

| Campo | Tipo |
|---|---|
| id | UUID |
| condominio_id | UUID |
| mes_referencia | Data |
| saldo_mes_anterior | Decimal |
| total_receitas | Decimal |
| total_despesas | Decimal |
| credito_mes | Decimal |
| total_atrasos | Decimal |
| saldo_reserva_gas | Decimal |
| saldo_conta_corrente | Decimal |
| saldo_poupanca | Decimal |

## Tabela `receitas`

| Campo | Tipo |
|---|---|
| id | UUID |
| prestacao_contas_id | UUID |
| descricao | Texto |
| valor | Decimal |
| origem | Enum |
| referencia_id | UUID |

## Tabela `despesas`

| Campo | Tipo |
|---|---|
| id | UUID |
| prestacao_contas_id | UUID |
| descricao | Texto |
| categoria | Texto |
| valor | Decimal |
| data_pagamento | Data |

## Tabela `movimentacoes_financeiras`

| Campo | Tipo |
|---|---|
| id | UUID |
| prestacao_contas_id | UUID |
| conta | Enum |
| descricao | Texto |
| valor | Decimal |
| tipo | Enum |

Contas possíveis:

- Reserva para gás.
- Conta corrente.
- Conta poupança.

Tipos possíveis:

- Entrada.
- Saída.
- Transferência.

## 8. Regras de Validação

- A leitura atual do gás não pode ser menor que a leitura anterior.
- O consumo de gás não pode ser negativo.
- Valores monetários não podem ser negativos, exceto movimentações financeiras de saída ou ajustes.
- Uma cobrança mensal deve ter exatamente um item por apartamento ativo.
- O total geral da cobrança deve ser igual à soma dos totais por apartamento.
- A prestação de contas deve importar os totais da cobrança do mesmo mês.
- O saldo inicial de um mês deve vir do saldo final do mês anterior, quando houver histórico.
- Uma cobrança paga parcialmente deve continuar aparecendo como pendência.
- Pagamento atrasado deve entrar como receita no mês em que foi efetivamente pago.

## 9. Automações Desejadas

- Criar novo mês copiando apartamentos, taxas e últimas leituras do mês anterior.
- Preencher leitura anterior automaticamente com a leitura atual do mês anterior.
- Calcular consumo de gás ao informar leitura atual.
- Gerar totais automaticamente.
- Gerar PDF da cobrança mensal.
- Gerar PDF da prestação de contas.
- Alertar apartamentos com pagamento em atraso.
- Consolidar relatório anual.

## 10. Permissões de Usuário

## Administrador/Síndica

Pode:

- Gerenciar apartamentos.
- Criar e editar cobranças.
- Lançar despesas.
- Lançar pagamentos.
- Fechar prestação de contas.
- Emitir relatórios.

## Morador/Proprietário

Pode:

- Ver cobranças do próprio apartamento.
- Ver histórico de pagamentos.
- Ver demonstrativos mensais.
- Baixar boletos/PDFs, se existirem.

## 11. Critérios de Aceite do MVP

- O sistema permite cadastrar os 9 apartamentos.
- O sistema permite criar uma cobrança mensal.
- O sistema calcula consumo de gás automaticamente.
- O sistema calcula valor do gás automaticamente.
- O sistema calcula total a pagar por apartamento.
- O sistema calcula totais gerais do mês.
- O sistema permite lançar despesas da prestação de contas.
- O sistema calcula receitas, despesas e crédito do mês.
- O sistema controla saldos de reserva para gás, conta corrente e poupança.
- O sistema registra condomínios em atraso.
- O sistema gera relatório mensal similar à planilha original.

## 12. Observações Importantes para Desenvolvimento

- A planilha usa meses como abas separadas; o software deve usar registros por mês no banco de dados.
- A planilha usa fórmulas entre abas; o software deve transformar essas fórmulas em regras de negócio.
- O modelo atual mistura cobrança, inadimplência, despesas e saldos; no software, essas áreas devem ser separadas em módulos.
- Valores monetários devem ser armazenados como decimal, não como texto formatado.
- Datas devem ser armazenadas como data real.
- O relatório final pode manter visual parecido com a planilha para facilitar adoção pelos usuários.
