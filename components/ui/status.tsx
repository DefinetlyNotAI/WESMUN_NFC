import React from "react";
import {StatusIconProps} from "@/types";
import {CheckCircle2, XCircle} from "lucide-react";

export const StatusIcon: React.FC<StatusIconProps> = ({active, activeLabel, inactiveLabel}) => (
    <div className="flex items-center gap-2">
        {active ? (
            <CheckCircle2 className="h-4 w-4 text-green-600"/>
        ) : (
            <XCircle className="h-4 w-4 text-muted-foreground"/>
        )}
        <span className="text-xs text-muted-foreground">{active ? activeLabel : inactiveLabel}</span>
    </div>
)