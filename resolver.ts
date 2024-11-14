import { v4 as uuidv4 } from 'uuid';
import { GraphQLError } from 'graphql';

type Model = {
    id: string;
    type: string;
    status: string;
    alpha?: number;
    createTime: number;
    waitTime?: number;
}

const EXECUTION_TIME = 60000;

const models: Map<string, Model> = new Map();

const mockPythonExecution = () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, EXECUTION_TIME);
    });
}

const resolvers = {
    Query: {
        predict: (_: any, { modelId, x }: { modelId: string, x: number }) => {
            const model = models.get(modelId);
            if (!model) {
                throw new GraphQLError("Model not found");
            }
            if (model.status !== 'COMPLETED') {
                throw new GraphQLError('Model not ready.');
            }
            return x + 1;
        },
        modelStatus: (_: any, { id }: { id: string }) => {
            const model = models.get(id);
            if (!model) throw new GraphQLError("Model not found");

            if (model.status === "PENDING" && model.createTime) {
                const elapsedTime = Date.now() - model.createTime;
                const remainingTime = (EXECUTION_TIME - elapsedTime) / 1000;
                return {
                    ...model,
                    waitTime: remainingTime > 0 ? remainingTime : 0
                };
            }
            return { ...model, waitingTime: null };
        }
    },
    Mutation: {
        runRegression: async (_: any, { data, modelType, alpha }: { data: Array<{ x: number, y: number }>, modelType: string, alpha?: number }) => {
            // Validation: Check if `alpha` is positive for Lasso and Ridge models
            if ((modelType === "LASSO" || modelType === "RIDGE") && alpha !== undefined && alpha <= 0) {
                throw new GraphQLError("The optional 'alpha' parameter must be a positive float for Lasso and Ridge models.");
            }
            
            const id = uuidv4()
            const newModel: Model = {
                id: id,
                type: modelType,
                status: "PENDING",
                alpha: modelType !== "LINEAR" ? alpha : undefined,
                createTime: Date.now()
            };

            models.set(id, newModel);

            // Start the mock long-running task asynchronously
            mockPythonExecution().then(() => {
                const model = models.get(id);
                if (model) model.status = "COMPLETED";
            });

            return newModel; // Return immediately with `PENDING` status
        }
    }
}

export default resolvers