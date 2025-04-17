const GRADER_TEMPLATE = `You are grader assessing the relevance of the documents to a user question.
Here is the retrieved document:

<document>
{content}
</document>

Here is the user question:
<question>
{question}
</question>

If the document contains keywords related to the user question, grade it as relevant.
If it does not, grade it as irrelevant. The goal is to filter the erroneous retrievals.
Give binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.`

const ANSWER_GRADER_PROMPT_TEMPLATE =
    `You are a grader assessing whether an answer is useful to resolve a question.
Here is the answer:

<answer>
{generation} 
</answer>

Here is the question:

<question>
{question}
</question>

Give a binary score 'yes' or 'no' to indicate whether the answer is useful to resolve a question.`;

export { GRADER_TEMPLATE, ANSWER_GRADER_PROMPT_TEMPLATE };